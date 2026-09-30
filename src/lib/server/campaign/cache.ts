import type { RedisClient } from '$lib/server/redis';

/** Redis key holding the resolved redirect config for a slug (read by the redirect engine). */
export const campaignCacheKey = (slug: string) => `link:${slug}`;

export const CAMPAIGN_CACHE_TTL_SECONDS = 300;

/**
 * Best effort: a Redis outage must not fail the DB write. Worst case the old config
 * is served until the cache TTL expires.
 */
export async function invalidateCampaignCache(
  redis: RedisClient | undefined,
  ...slugs: (string | null | undefined)[]
): Promise<void> {
  const keys = [...new Set(slugs.filter((slug): slug is string => Boolean(slug)))].map(
    campaignCacheKey
  );
  if (!redis || keys.length === 0) return;
  try {
    await redis.delete(...keys);
  } catch (error) {
    console.error('[campaign-cache] invalidation failed', { keys, error });
  }
}
