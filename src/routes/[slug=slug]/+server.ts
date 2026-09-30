/**
 * Redirect endpoint — the core of the platform.
 *
 * Deliberately kept thin: all logic lives in the redirect engine
 * (src/lib/server/redirect/engine.ts) so it can be unit-tested
 * without a live SvelteKit server.
 *
 * trailingSlash: 'ignore' — Facebook appends a trailing slash to the
 * URL inside lm.facebook.com/l.php; SvelteKit's default 'never' would
 * issue a 308 redirect that strips the slug's query params. 'ignore'
 * means /slug/ and /slug are treated identically.
 */
import { handleRedirect } from '$lib/server/redirect/engine';
import { getRedirectEnvironment } from '$lib/server/redirect/environment';
import { getUpstash } from '$lib/server/upstash';
import type { RequestHandler } from './$types';

export const trailingSlash = 'ignore';
export const prerender = false;

// The redirect route must respond to HEAD (for uptime checks) as well as GET.
export const GET: RequestHandler = async (event) => {
  const env = getRedirectEnvironment();
  const redis = getUpstash();

  return handleRedirect(event, event.params.slug, {
    redis,
    secret: env.secret,
    rateLimit: env.rateLimit,
    trustVercelGeo: env.trustVercelGeo,
    // Use the first configured platform host, falling back to the request's own host.
    platformHost: env.platformHosts[0] ?? event.url.hostname,
  });
};

export const HEAD: RequestHandler = async (event) => {
  const response = await GET(event);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
};
