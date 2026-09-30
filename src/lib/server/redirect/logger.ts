/**
 * Non-blocking click event logging via `@vercel/functions` waitUntil.
 *
 * The redirect Response is returned to the visitor immediately;
 * the DB insert runs in the background without blocking the response.
 */
import { db } from '$lib/server/db';
import { campaign, clickEvent } from '$lib/server/db/schema';
import { waitUntil } from '@vercel/functions';
import { eq, sql } from 'drizzle-orm';

export type ClickDecision =
  | 'redirected'
  | 'preview'
  | 'blocked_geo'
  | 'blocked_ip'
  | 'blocked_device'
  | 'blocked_browser'
  | 'bot'
  | 'rate_limited';

export interface ClickPayload {
  campaignId: string;
  destinationId: string | null;
  decision: ClickDecision;
  country: string | null;
  device: string;
  browser: string;
  os: string | null;
  isInApp: boolean;
  ipHash: string | null;
  referrerHost: string | null;
  hasFbclid: boolean;
  fbclidSource: "fallback" | "native" | "none"
}

async function writeClick(payload: ClickPayload): Promise<void> {
  try {
    // Insert click event and increment the campaign counter atomically.
    await db.batch([
      db.insert(clickEvent).values({
        campaignId: payload.campaignId,
        destinationId: payload.destinationId ?? undefined,
        decision: payload.decision,
        country: payload.country,
        device: payload.device,
        browser: payload.browser,
        os: payload.os,
        isInApp: payload.isInApp,
        ipHash: payload.ipHash,
        referrerHost: payload.referrerHost,
        hasFbclid: payload.hasFbclid,
        fbclidSource: payload.fbclidSource,
      }),
      // Only count real redirections and previews towards totalClicks.
      ...(payload.decision === 'redirected' || payload.decision === 'preview'
        ? [
          db
            .update(campaign)
            .set({ totalClicks: sql`${campaign.totalClicks} + 1` })
            .where(eq(campaign.id, payload.campaignId)),
        ]
        : []),
    ] as Parameters<typeof db.batch>[0]);
  } catch (err) {
    // Log the error server-side but never surface it to the visitor.
    console.error('[redirect-logger] failed to write click event', err);
  }
}

/**
 * Schedule a click event insert via Vercel's `waitUntil`.
 * Falls back to a fire-and-forget Promise outside Vercel environments.
 */
export function logClick(payload: ClickPayload): void {
  const promise = writeClick(payload);
  try {
    waitUntil(promise);
  } catch {
    // Outside Vercel (dev / tests) waitUntil is not available.
    promise.catch(() => { /* already logged inside writeClick */ });
  }
}

/**
 * Extract the referrer host from a request without leaking full URLs.
 * Returns null when the Referrer is absent, same-site, or malformed.
 */
export function extractReferrerHost(
  request: Request,
  platformHost: string,
): string | null {
  const raw = request.headers.get('referer') ?? request.headers.get('referrer');
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host === platformHost || host === '' ? null : host;
  } catch {
    return null;
  }
}
