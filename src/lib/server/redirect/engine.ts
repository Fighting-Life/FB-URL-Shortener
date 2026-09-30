/**
 * Redirect engine — wires together: resolver → rules → rotation → response.
 *
 * Input:  request + slug + redis client + env config
 * Output: a web Response (redirect, interstitial, OG preview, 404, or 429)
 *
 * Guarantees:
 * - The route slug route (`trailingSlash: 'ignore'`) passes raw URLSearchParams
 *   to this engine; the engine forwards them to the destination.
 * - No session lookup, no auth cookie read, no SvelteKit layout involvement —
 *   the fast-path in hooks.server.ts intercepts redirect requests before those.
 * - Click events are written non-blocking via waitUntil.
 * - Preview crawlers receive honest OG metadata; no divergent "safe page" routing.
 */
import type { RequestEvent } from '@sveltejs/kit';
import type { Redis } from '@upstash/redis';
import { withFallbackFbclid } from './fallback.js';
import {
  getVisitorAddress,
  getVisitorCountry,
  hashVisitor,
  readSticky,
  signSticky,
} from './identity.js';
import { extractReferrerHost, logClick } from './logger.js';
import { renderInterstitial, renderPreview } from './pages.js';
import {
  buildDestinationUrl,
  classifyVisitor,
  eligibleDestinations,
  evaluateRules,
  selectDestination,
} from './policy.js';
import type { RedirectConfig } from './resolver.js';
import { claimClick, resolveConfig, resolveGlobalTags } from './resolver.js';


export interface EngineOptions {
  redis?: Redis | null;
  /** Validated at module load by getRedirectEnvironment(). */
  secret: string;
  rateLimit: number;
  trustVercelGeo: boolean;
  platformHost: string;
}

const STICKY_COOKIE_PREFIX = 'v_';
const ROUND_ROBIN_KEY_PREFIX = 'rr:';
const RATE_LIMIT_WINDOW_SEC = 60;

// ---------- helpers ----------

function blockedResponse(blockAction: 'not_found' | 'forbidden'): Response {
  return new Response(null, {
    status: blockAction === 'forbidden' ? 403 : 404,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function rateLimitedResponse(): Response {
  return new Response(null, {
    status: 429,
    headers: {
      'Cache-Control': 'no-store',
      'Retry-After': '60',
    },
  });
}

function directRedirectResponse(destinationUrl: string, noReferrer: boolean): Response {
  const headers = new Headers({
    Location: destinationUrl,
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  });
  if (noReferrer) headers.set('Referrer-Policy', 'no-referrer');
  return new Response(null, { status: 302, headers });
}

async function getRoundRobinSequence(
  redis: Redis | null | undefined,
  campaignId: string,
): Promise<number | undefined> {
  if (!redis) return undefined;
  try {
    // INCR is atomic; wrapping around Number.MAX_SAFE_INTEGER is safe via modulo in selectDestination.
    const seq = await redis.incr(`${ROUND_ROBIN_KEY_PREFIX}${campaignId}`);
    return typeof seq === 'number' ? seq : undefined;
  } catch {
    return undefined;
  }
}

async function checkRateLimit(
  redis: Redis | null | undefined,
  ip: string | null,
  slug: string,
  limit: number,
): Promise<boolean> {
  if (!redis || !ip) return true; // no Redis → skip limit, missing IP → skip limit
  try {
    const key = `rl:${slug}:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW_SEC);
    return count <= limit;
  } catch {
    return true; // Redis error → allow through
  }
}

// ---------- main entry ----------

export async function handleRedirect(
  event: RequestEvent,
  slug: string,
  opts: EngineOptions,
): Promise<Response> {
  const { request, cookies } = event;
  const { redis, secret, rateLimit, trustVercelGeo, platformHost } = opts;

  // 1. Resolve config (cache → DB)
  const config = await resolveConfig(slug, redis);
  if (!config) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  // 2. Check campaign expiry
  if (config.expiresAt && config.expiresAt.getTime() < Date.now()) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  // 3. Classify visitor (UA, device, browser, bot score)
  const visitor = classifyVisitor(request.headers);

  // 4. Crawler preview — return OG metadata, no click recorded
  if (visitor.isPreview) {
    const urls = config.destinations.map((d) => d.url);
    const canonicalUrl = `${event.url.origin}/${slug}`;
    return renderPreview(config, urls, canonicalUrl);
  }

  // 5. Rate limit
  const ip = getVisitorAddress(event);
  const withinLimit = await checkRateLimit(redis, ip, slug, rateLimit);
  if (!withinLimit) {
    logClick({
      campaignId: config.id,
      destinationId: null,
      decision: 'rate_limited',
      country: getVisitorCountry(request.headers, trustVercelGeo),
      ...visitorMeta(visitor, ip, secret, config.id),
      referrerHost: extractReferrerHost(request, platformHost),
      hasFbclid: event.url.searchParams.has('fbclid'),
      fbclidSource: event.url.searchParams.has('fbclid') ? 'native' : 'none',
    });
    return rateLimitedResponse();
  }

  // 6. Rules (global IP → campaign IP → geo → device → browser)
  const country = getVisitorCountry(request.headers, trustVercelGeo);
  const blocked = evaluateRules(config.rules, {
    ip,
    country,
    device: visitor.device,
    browser: visitor.browser,
  });

  if (blocked) {
    logClick({
      campaignId: config.id,
      destinationId: null,
      decision: blocked,
      country,
      ...visitorMeta(visitor, ip, secret, config.id),
      referrerHost: extractReferrerHost(request, platformHost),
      hasFbclid: event.url.searchParams.has('fbclid'),
      fbclidSource: event.url.searchParams.has('fbclid') ? 'native' : 'none',
    });
    return blockedResponse(config.blockAction);
  }

  // 7. Bot check
  if (visitor.isBot && config.botAction === 'block') {
    logClick({
      campaignId: config.id,
      destinationId: null,
      decision: 'bot',
      country,
      ...visitorMeta(visitor, ip, secret, config.id),
      referrerHost: extractReferrerHost(request, platformHost),
      hasFbclid: event.url.searchParams.has('fbclid'),
      fbclidSource: event.url.searchParams.has('fbclid') ? 'native' : 'none',
    });
    return blockedResponse(config.blockAction);
  }

  // 8. Select destination
  const now = Date.now();
  const eligible = eligibleDestinations(config.destinations, now);
  if (eligible.length === 0) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  // Sticky visitor: read cookie, verify HMAC + expiry, check still eligible
  const stickyCookieName = `${STICKY_COOKIE_PREFIX}${config.id}`;
  const stickyRaw = cookies.get(stickyCookieName);
  const stickyId = config.stickyVisitor ? readSticky(stickyRaw, config.id, secret, now) : undefined;

  const sequence = config.rotationStrategy === 'equal'
    ? await getRoundRobinSequence(redis, config.id)
    : undefined;

  const destination = selectDestination(eligible, config.rotationStrategy, {
    sequence,
    stickyId,
  });

  if (!destination) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  // 9. Claim click (atomic cap check)
  if (destination.clickCap !== null) {
    const newCount = await claimClick(destination.id, destination.clickCap);
    if (newCount === null) {
      // This destination is capped; re-select from the others
      const remaining = eligible.filter((d) => d.id !== destination.id);
      if (remaining.length === 0) {
        return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
      }
      const fallback = selectDestination(remaining, config.rotationStrategy, { sequence });
      if (!fallback) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
      return dispatchRedirect(event, config, fallback.id, fallback.url, {
        opts, ip, country, visitor, secret, now,
        stickyCookieName, platformHost,
      });
    }
  }

  return dispatchRedirect(event, config, destination.id, destination.url, {
    opts, ip, country, visitor, secret, now,
    stickyCookieName, platformHost,
  });
}

// ---------- dispatch (build URL + cookies + response) ----------

interface DispatchCtx {
  opts: EngineOptions;
  ip: string | null;
  country: string | null;
  visitor: ReturnType<typeof classifyVisitor>;
  secret: string;
  now: number;
  stickyCookieName: string;
  platformHost: string;
}

function visitorMeta(
  visitor: ReturnType<typeof classifyVisitor>,
  ip: string | null,
  secret: string,
  scope: string,
) {
  return {
    device: visitor.device,
    browser: visitor.browser,
    os: visitor.os,
    isInApp: visitor.isInApp,
    ipHash: hashVisitor(ip, secret, scope),
  };
}

async function dispatchRedirect(
  event: RequestEvent,
  config: RedirectConfig,
  destinationId: string,
  destinationUrl: string,
  ctx: DispatchCtx,
): Promise<Response> {
  const { opts, ip, country, visitor, secret, now, stickyCookieName, platformHost } = ctx;

  const hadNativeFbclid = event.url.searchParams.has('fbclid');
  const { params: incomingParams, injected: fallbackInjected } = withFallbackFbclid(
    event.url.searchParams,
    {
      key: 'fbclid',
      enabled: config.fallbackFbclid && config.forwardQuery !== 'none',
    }
  );

  // Build the final URL with query forwarding
  const finalUrl = buildDestinationUrl(destinationUrl, incomingParams, {
    forwardQuery: config.forwardQuery,
    forwardQueryKeys: config.forwardQueryKeys,
    queryConflict: config.queryConflict,
  });

  const hasFbclid = incomingParams.has('fbclid');
  const referrerHost = extractReferrerHost(event.request, platformHost);

  // Merge global tags + campaign-specific tags, deduped by provider+tagId
  const globalTags = await resolveGlobalTags(opts.redis);
  const allTags = [...globalTags, ...config.tags];

  const noReferrer = config.referrerMode === 'no_referrer';
  const useInterstitial = config.delayMs > 0 || allTags.some((t) => t.isActive);

  const fbclidSource: 'native' | 'fallback' | 'none' = hadNativeFbclid
    ? 'native'
    : fallbackInjected
      ? 'fallback'
      : 'none';

  // Log the click (non-blocking)
  logClick({
    campaignId: config.id,
    destinationId,
    decision: 'redirected',
    country,
    ...visitorMeta(visitor, ip, secret, config.id),
    referrerHost,
    hasFbclid,
    fbclidSource,
  });

  // Sticky cookie — set/refresh after successful destination selection
  if (config.stickyVisitor) {
    const ttlMs = config.stickyTtlHours * 60 * 60 * 1_000;
    const expiresAt = now + ttlMs;
    const cookieValue = signSticky(config.id, destinationId, expiresAt, secret);
    event.cookies.set(stickyCookieName, cookieValue, {
      path: '/',
      maxAge: Math.floor(ttlMs / 1000),
      httpOnly: true,
      sameSite: 'lax',
      secure: event.url.protocol === 'https:',
    });
  }

  if (!useInterstitial) {
    return directRedirectResponse(finalUrl, noReferrer);
  }

  // GPC/DNT: respect privacy signals — pass trackingEnabled=false to renderInterstitial
  const dnt = event.request.headers.get('dnt');
  const secGpc = event.request.headers.get('sec-gpc');
  const trackingEnabled = dnt !== '1' && secGpc !== '1';

  return renderInterstitial(
    { ...config, delayMs: config.delayMs },
    finalUrl,
    allTags,
    { trackingEnabled },
  );
}
