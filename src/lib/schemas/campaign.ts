import { isValidCustomSlug } from '$lib/utils/slug';
import { z } from 'zod';

// Keep in sync with the pg enums in src/lib/server/db/schema.ts.
export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;
export const ROTATION_STRATEGIES = ['equal', 'percentage', 'priority'] as const;
export const FORWARD_QUERY_MODES = ['all', 'allowlist', 'none'] as const;
export const QUERY_CONFLICTS = ['destination_wins', 'incoming_wins'] as const;
export const REFERRER_MODES = ['passthrough', 'no_referrer'] as const;
// `challenge` exists in the DB enum but is not implemented yet.
export const BOT_ACTIONS = ['log_only', 'block'] as const;
export const BLOCK_ACTIONS = ['not_found', 'forbidden'] as const;
export const RULE_MODES = ['allow', 'deny'] as const;
export const TAG_PROVIDERS = ['gtag', 'fb_pixel', 'tiktok_pixel', 'histats'] as const;

export const DEVICE_TYPES = ['mobile', 'tablet', 'desktop', 'tv', 'unknown'] as const;
export const BROWSER_TYPES = [
  'chrome',
  'safari',
  'firefox',
  'edge',
  'samsung',
  'opera',
  'facebook_in_app',
  'instagram_in_app',
  'other'
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type RotationStrategy = (typeof ROTATION_STRATEGIES)[number];
export type TagProvider = (typeof TAG_PROVIDERS)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];
export type BrowserType = (typeof BROWSER_TYPES)[number];

export const MAX_DESTINATIONS = 50;
export const MAX_DELAY_MS = 10_000;

// Tag IDs only — the redirect page renders vetted snippets, never user-supplied HTML.
export const TAG_ID_PATTERNS: Record<TagProvider, { pattern: RegExp; example: string }> = {
  gtag: { pattern: /^(G|GT|AW|DC)-[A-Z0-9]{4,20}$|^GTM-[A-Z0-9]{4,12}$/, example: 'G-XXXXXXX or GTM-XXXXXX' },
  fb_pixel: { pattern: /^\d{10,20}$/, example: '123456789012345' },
  tiktok_pixel: { pattern: /^[A-Z0-9]{10,32}$/, example: 'C4ABCDEFGHIJKLMNOPQR' },
  histats: { pattern: /^\d{3,10}$/, example: '4912345' }
};

const PRIVATE_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa'];

function isPrivateIPv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const [a, b] = [Number(match[1]), Number(match[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIPv6(host: string): boolean {
  if (!host.startsWith('[')) return false;
  const ip = host.slice(1, -1).toLowerCase();
  return (
    ip === '::' ||
    ip === '::1' ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80') ||
    ip.startsWith('::ffff:')
  );
}

/** Public http(s) URL without credentials that does not point at a private/local network. */
export function isPublicHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;

  // WHATWG URL already normalizes tricks like `0x7f.1` or `2130706433` to dotted IPv4.
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return false;
  }
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) return false;
  return host.includes('.') || host.startsWith('[');
}

const destinationUrlSchema = z
  .string()
  .trim()
  .min(1, 'Destination URL is required')
  .max(2048, 'URL is too long')
  .refine(isPublicHttpUrl, 'Use a public http(s) URL (no localhost, private IPs, or credentials)');

const optionalImageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === '' || isPublicHttpUrl(value), 'Use a public http(s) image URL');

export const destinationInputSchema = z
  .object({
    id: z.uuid().optional(),
    url: destinationUrlSchema,
    label: z.string().trim().max(120).default(''),
    weight: z.number().int().min(0).max(100).default(100),
    priority: z.number().int().min(1).max(1000).default(1),
    isActive: z.boolean().default(true),
    clickCap: z.number().int().min(1).nullable().default(null),
    startsAt: z.date().nullable().default(null),
    endsAt: z.date().nullable().default(null)
  })
  .superRefine((destination, ctx) => {
    if (destination.startsAt && destination.endsAt && destination.endsAt <= destination.startsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'End time must be after the start time'
      });
    }
  });

const countryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}$/, 'Use uppercase ISO 3166-1 alpha-2 country codes');

const ipOrCidrSchema = z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()], {
  error: 'Use an IPv4/IPv6 address or CIDR range'
});

function ruleSchema<T extends z.ZodType<string>>(value: T, max: number) {
  return z.object({
    mode: z.enum(RULE_MODES).default('deny'),
    // An empty list disables the rule.
    values: z.array(value).max(max).default([])
  });
}

const EMPTY_RULE = { mode: 'deny' as const, values: [] };

export const campaignRulesSchema = z.object({
  geo: ruleSchema(countryCodeSchema, 250).default(EMPTY_RULE),
  ip: ruleSchema(ipOrCidrSchema, 500).default(EMPTY_RULE),
  device: ruleSchema(z.enum(DEVICE_TYPES), DEVICE_TYPES.length).default(EMPTY_RULE),
  browser: ruleSchema(z.enum(BROWSER_TYPES), BROWSER_TYPES.length).default(EMPTY_RULE)
});

export const tagInputSchema = z
  .object({
    provider: z.enum(TAG_PROVIDERS),
    tagId: z.string().trim().min(1, 'Tag ID is required').max(64),
    isActive: z.boolean().default(true)
  })
  .superRefine((tag, ctx) => {
    const { pattern, example } = TAG_ID_PATTERNS[tag.provider];
    if (!pattern.test(tag.tagId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['tagId'],
        message: `Invalid ID format, expected something like ${example}`
      });
    }
  });

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Campaign name is required').max(160),
    // Empty = generate a random slug.
    slug: z
      .string()
      .trim()
      .max(64)
      .refine((value) => value === '' || isValidCustomSlug(value), {
        message: 'Use 3-64 letters, numbers, hyphens, or underscores; reserved words are not allowed'
      })
      .default(''),
    description: z.string().trim().max(1000).default(''),
    status: z.enum(CAMPAIGN_STATUSES).default('draft'),
    rotationStrategy: z.enum(ROTATION_STRATEGIES).default('equal'),
    delayMs: z.number().int().min(0).max(MAX_DELAY_MS).default(0),
    forwardQuery: z.enum(FORWARD_QUERY_MODES).default('all'),
    forwardQueryKeys: z
      .array(
        z
          .string()
          .trim()
          .regex(/^[A-Za-z0-9_.[\]-]{1,64}$/, 'Invalid query parameter name')
      )
      .max(50)
      .default([]),
    queryConflict: z.enum(QUERY_CONFLICTS).default('destination_wins'),
    referrerMode: z.enum(REFERRER_MODES).default('passthrough'),
    stickyVisitor: z.boolean().default(false),
    fallbackFbclid: z.boolean().default(false),
    stickyTtlHours: z.number().int().min(1).max(720).default(24),
    botAction: z.enum(BOT_ACTIONS).default('log_only'),
    blockAction: z.enum(BLOCK_ACTIONS).default('not_found'),
    ogTitle: z.string().trim().max(200).default(''),
    ogDescription: z.string().trim().max(500).default(''),
    ogImage: optionalImageUrlSchema.default(''),
    expiresAt: z.date().nullable().default(null),
    destinations: z
      .array(destinationInputSchema)
      .min(1, 'Add at least one destination')
      .max(MAX_DESTINATIONS, `At most ${MAX_DESTINATIONS} destinations`),
    rules: campaignRulesSchema.default({
      geo: EMPTY_RULE,
      ip: EMPTY_RULE,
      device: EMPTY_RULE,
      browser: EMPTY_RULE
    }),
    tags: z.array(tagInputSchema).max(10).default([])
  })
  .superRefine((campaign, ctx) => {
    const active = campaign.destinations.filter((destination) => destination.isActive);

    if (campaign.status === 'active' && active.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinations'],
        message: 'An active campaign needs at least one active destination'
      });
    }

    if (campaign.rotationStrategy === 'percentage' && active.length > 0) {
      const total = active.reduce((sum, destination) => sum + destination.weight, 0);
      if (total !== 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['destinations'],
          message: `Active destination percentages must total 100 (currently ${total})`
        });
      }
    }

    if (campaign.forwardQuery === 'allowlist' && campaign.forwardQueryKeys.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['forwardQueryKeys'],
        message: 'Add at least one query parameter (e.g. fbclid) to forward'
      });
    }

    const seenTags = new Set<string>();
    campaign.tags.forEach((tag, index) => {
      const key = `${tag.provider}:${tag.tagId}`;
      if (seenTags.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tags', index, 'tagId'],
          message: 'Duplicate tag'
        });
      }
      seenTags.add(key);
    });
  });

export const campaignListFilterSchema = z.object({
  q: z.string().trim().max(100).default(''),
  status: z.enum(CAMPAIGN_STATUSES).optional().catch(undefined),
  strategy: z.enum(ROTATION_STRATEGIES).optional().catch(undefined),
  sort: z.enum(['created_desc', 'created_asc', 'name_asc', 'clicks_desc']).catch('created_desc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((value) => [10, 20, 50].includes(value))
    .catch(20),
  scope: z.enum(['mine', 'all']).catch('mine')
});

export type CampaignFormInput = z.input<typeof campaignFormSchema>;
export type CampaignFormData = z.output<typeof campaignFormSchema>;
export type DestinationInput = z.output<typeof destinationInputSchema>;
export type CampaignRulesInput = z.output<typeof campaignRulesSchema>;
export type TagInput = z.output<typeof tagInputSchema>;
export type CampaignListFilter = z.output<typeof campaignListFilterSchema>;
