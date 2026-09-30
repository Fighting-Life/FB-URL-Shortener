/**
 * Resolves a campaign config from cache (Redis) or database.
 *
 * Cache key: `link:{slug}` — TTL 5 min, invalidated on every campaign write.
 * Cache miss → query DB → set cache.
 *
 * `claimClick` performs an atomic counter increment inside Postgres so two
 * concurrent requests cannot both sneak past a `clickCap`.
 */
import { db } from '$lib/server/db';
import { campaign, campaignDestination } from '$lib/server/db/schema';
import { Redis } from '@upstash/redis';
import { asc, eq, sql } from 'drizzle-orm';
import { CAMPAIGN_CACHE_TTL_SECONDS, campaignCacheKey } from '../campaign/cache.js';

// ---------- public types ----------

export type RedirectDestination = {
  id: string;
  url: string;
  label: string;
  weight: number;
  priority: number;
  isActive: boolean;
  clickCap: number | null;
  clickCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
};

export type RedirectRule = {
  type: 'geo' | 'ip' | 'device' | 'browser';
  mode: 'allow' | 'deny';
  values: string[];
};

export type RedirectTag = {
  id: string;
  provider: 'gtag' | 'fb_pixel' | 'tiktok_pixel' | 'histats';
  tagId: string;
  isActive: boolean;
};

export type RedirectConfig = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  rotationStrategy: 'equal' | 'percentage' | 'priority';
  delayMs: number;
  forwardQuery: 'all' | 'allowlist' | 'none';
  forwardQueryKeys: string[];
  queryConflict: 'destination_wins' | 'incoming_wins';
  referrerMode: 'passthrough' | 'no_referrer';
  stickyVisitor: boolean;
  stickyTtlHours: number;
  botAction: 'log_only' | 'block' | 'challenge';
  blockAction: 'not_found' | 'forbidden';
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  expiresAt: Date | null;
  fallbackFbclid: boolean;
  destinations: RedirectDestination[];
  rules: RedirectRule[];
  tags: RedirectTag[];
};

// ---------- internals ----------

/** Restore Date objects after JSON round-trip (Redis stores them as ISO strings). */
function reviveConfig(raw: unknown): RedirectConfig {
  const c = raw as RedirectConfig;
  return {
    ...c,
    fallbackFbclid: c.fallbackFbclid === true,
    expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
    destinations: c.destinations.map((d) => ({
      ...d,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
    })),
  };
}

async function queryDb(slug: string): Promise<RedirectConfig | null> {
  const row = await db.query.campaign.findFirst({
    where: eq(campaign.slug, slug),
    columns: {
      id: true, userId: true, slug: true, name: true, status: true, deletedAt: true,
      rotationStrategy: true, delayMs: true, forwardQuery: true, forwardQueryKeys: true,
      queryConflict: true, referrerMode: true, stickyVisitor: true, stickyTtlHours: true,
      botAction: true, blockAction: true, ogTitle: true, ogDescription: true, ogImage: true,
      expiresAt: true,
      fallbackFbclid: true,
    },
    with: {
      destinations: {
        orderBy: [asc(campaignDestination.sortOrder)],
        columns: {
          id: true, url: true, label: true, weight: true, priority: true,
          isActive: true, clickCap: true, clickCount: true,
          startsAt: true, endsAt: true, sortOrder: true,
        },
      },
      rules: { columns: { type: true, mode: true, values: true } },
      tags: { columns: { id: true, provider: true, tagId: true, isActive: true } },
    },
  });
  if (!row || row.deletedAt !== null) return null;
  return row as unknown as RedirectConfig;
}

// ---------- public API ----------

/**
 * Resolve a slug to its redirect config.
 *
 * Non-active campaigns are cached normally (prevents repeat DB hits for typos)
 * but return `null` so the engine renders a 404.
 *
 * Status changes (pause/archive) take effect within `CAMPAIGN_CACHE_TTL_SECONDS`.
 * For immediate effect, call `invalidateCampaignCache` from the admin action.
 */
export async function resolveConfig(
  slug: string,
  redis?: Redis | null,
): Promise<RedirectConfig | null> {
  if (redis) {
    try {
      const cached = await redis.get<unknown>(campaignCacheKey(slug));
      if (cached !== null) {
        const config = reviveConfig(cached);
        return config.status === 'active' ? config : null;
      }
    } catch {
      // Cache unavailable — fall through to DB.
    }
  }

  const config = await queryDb(slug);

  // Always cache (including null-equivalent paused/deleted) to avoid thundering-herd
  // on popular slugs that happen to be paused.
  if (redis && config) {
    redis
      .set(campaignCacheKey(slug), JSON.stringify(config), { ex: CAMPAIGN_CACHE_TTL_SECONDS })
      .catch(() => { /* best effort */ });
  }

  return config?.status === 'active' ? config : null;
}

/**
 * Atomically increment a destination's click counter.
 *
 * Returns the new `clickCount` if the increment succeeded,
 * or `null` if the destination is already at or above its `clickCap`.
 * Uses a single UPDATE … RETURNING so two concurrent requests cannot
 * both slip through the cap.
 */
export async function claimClick(
  destinationId: string,
  clickCap: number | null,
): Promise<number | null> {
  const rows = await db
    .update(campaignDestination)
    .set({ clickCount: sql`${campaignDestination.clickCount} + 1` })
    .where(
      clickCap === null
        ? eq(campaignDestination.id, destinationId)
        : sql`${campaignDestination.id} = ${destinationId}
               AND ${campaignDestination.clickCount} < ${clickCap}`,
    )
    .returning({ clickCount: campaignDestination.clickCount });

  return rows[0]?.clickCount ?? null;
}

/** Fetch per-campaign global tag IDs for the platform (campaignId = NULL in DB). */
export async function resolveGlobalTags(redis?: Redis | null): Promise<RedirectTag[]> {
  const cacheKey = 'link:__global_tags__';
  if (redis) {
    try {
      const cached = await redis.get<RedirectTag[]>(cacheKey);
      if (cached) return cached;
    } catch { /* fall through */ }
  }

  const rows = await db.query.campaignTag.findMany({
    where: sql`campaign_id IS NULL AND is_active = true`,
    columns: { id: true, provider: true, tagId: true, isActive: true },
  });

  const tags = rows as RedirectTag[];
  if (redis) {
    redis
      .set(cacheKey, JSON.stringify(tags), { ex: CAMPAIGN_CACHE_TTL_SECONDS })
      .catch(() => { /* best effort */ });
  }
  return tags;
}
