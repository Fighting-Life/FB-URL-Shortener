/**
 * SvelteKit parameter matcher for campaign slugs.
 *
 * A slug is 3–64 URL-safe characters (letters, digits, hyphens, underscores).
 * Reserved slugs are blocked here so the redirect route does not shadow
 * any app route. The full reserved list lives in $lib/utils/slug.ts;
 * here we guard the most important prefixes structurally.
 *
 * SvelteKit resolves routes from most-specific to least-specific, so named
 * routes like /app, /api, /(home), /(auth) already take precedence over
 * [slug=slug] — the matcher is an extra safety net and type guard.
 */
import { RESERVED_SLUGS, SLUG_PATTERN } from '$lib/utils/slug';

export function match(value: string): boolean {
  if (!SLUG_PATTERN.test(value)) return false;
  if (RESERVED_SLUGS.has(value.toLowerCase())) return false;
  return true;
}
