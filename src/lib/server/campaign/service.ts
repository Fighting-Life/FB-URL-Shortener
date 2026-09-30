import { PUBLIC_SITE_URL } from '$env/static/public';
import { isAdmin } from '$lib/middleware/rules';
import type {
  CampaignFormData,
  CampaignListFilter,
  CampaignStatus,
  DestinationInput
} from '$lib/schemas/campaign';
import { db } from '$lib/server/db';
import {
  campaign,
  campaignDestination,
  campaignRule,
  campaignTag,
  user
} from '$lib/server/db/schema';
import { generateSlug, isValidCustomSlug } from '$lib/utils/slug';
import { error, type RequestEvent } from '@sveltejs/kit';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  notInArray,
  or,
  sql,
  type SQL
} from 'drizzle-orm';
import { z } from 'zod';
import { ServerBase } from '../server.js';
import { invalidateCampaignCache } from './cache.js';

type BatchStatements = Parameters<typeof db.batch>[0];
type BatchStatement = BatchStatements[number];

export type CampaignErrorCode = 'not_found' | 'slug_taken' | 'destination_self' | 'invalid_state';

export class CampaignError extends Error {
  constructor(
    public readonly code: CampaignErrorCode,
    message: string,
    /** Superforms field path, e.g. `slug` or `destinations[0].url`. */
    public readonly path?: string
  ) {
    super(message);
    this.name = 'CampaignError';
  }
}

export type CampaignDetail = NonNullable<Awaited<ReturnType<CampaignService['get']>>>;

const RULE_TYPES = ['geo', 'ip', 'device', 'browser'] as const;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function isUniqueViolation(cause: unknown): boolean {
  let current: unknown = cause;
  for (let depth = 0; current && depth < 4; depth++) {
    if ((current as { code?: unknown }).code === '23505') return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

function campaignColumns(input: CampaignFormData) {
  return {
    name: input.name,
    description: input.description,
    status: input.status,
    rotationStrategy: input.rotationStrategy,
    delayMs: input.delayMs,
    forwardQuery: input.forwardQuery,
    forwardQueryKeys: [...new Set(input.forwardQueryKeys)],
    queryConflict: input.queryConflict,
    referrerMode: input.referrerMode,
    stickyVisitor: input.stickyVisitor,
    stickyTtlHours: input.stickyTtlHours,
    botAction: input.botAction,
    blockAction: input.blockAction,
    ogTitle: input.ogTitle || null,
    ogDescription: input.ogDescription || null,
    ogImage: input.ogImage || null,
    expiresAt: input.expiresAt
  };
}

function destinationColumns(destination: DestinationInput, sortOrder: number) {
  return {
    url: destination.url,
    label: destination.label,
    weight: destination.weight,
    priority: destination.priority,
    isActive: destination.isActive,
    clickCap: destination.clickCap,
    startsAt: destination.startsAt,
    endsAt: destination.endsAt,
    sortOrder
  };
}

function ruleAndTagInserts(campaignId: string, input: CampaignFormData): BatchStatement[] {
  const rules = RULE_TYPES.flatMap((type) => {
    const rule = input.rules[type];
    const values = [...new Set<string>(rule.values)];
    return values.length ? [{ campaignId, type, mode: rule.mode, values }] : [];
  });
  const tags = input.tags.map((tag) => ({ campaignId, ...tag }));

  return [
    ...(rules.length ? [db.insert(campaignRule).values(rules)] : []),
    ...(tags.length ? [db.insert(campaignTag).values(tags)] : [])
  ];
}

/** Maps a stored campaign to the shape expected by `campaignFormSchema` (edit form). */
export function campaignToForm(row: CampaignDetail): CampaignFormData {
  const rule = <T extends string>(type: (typeof RULE_TYPES)[number]) => {
    const found = row.rules.find((item) => item.type === type);
    return { mode: found?.mode ?? 'deny', values: (found?.values ?? []) as T[] };
  };

  return {
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    rotationStrategy: row.rotationStrategy,
    delayMs: row.delayMs,
    forwardQuery: row.forwardQuery,
    forwardQueryKeys: row.forwardQueryKeys,
    queryConflict: row.queryConflict,
    referrerMode: row.referrerMode,
    stickyVisitor: row.stickyVisitor,
    fallbackFbclid: row.fallbackFbclid,
    stickyTtlHours: row.stickyTtlHours,
    botAction: row.botAction === 'challenge' ? 'block' : row.botAction,
    blockAction: row.blockAction,
    ogTitle: row.ogTitle ?? '',
    ogDescription: row.ogDescription ?? '',
    ogImage: row.ogImage ?? '',
    expiresAt: row.expiresAt,
    destinations: row.destinations.map((destination) => ({
      id: destination.id,
      url: destination.url,
      label: destination.label,
      weight: destination.weight,
      priority: destination.priority,
      isActive: destination.isActive,
      clickCap: destination.clickCap,
      startsAt: destination.startsAt,
      endsAt: destination.endsAt
    })),
    rules: {
      geo: rule('geo'),
      ip: rule('ip'),
      device: rule<CampaignFormData['rules']['device']['values'][number]>('device'),
      browser: rule<CampaignFormData['rules']['browser']['values'][number]>('browser')
    },
    tags: row.tags.map((tag) => ({
      provider: tag.provider,
      tagId: tag.tagId,
      isActive: tag.isActive
    }))
  };
}

export class CampaignService extends ServerBase {
  constructor(protected readonly event: RequestEvent) {
    super(event);
  }

  private requireActor() {
    const actor = this.user;
    if (!actor) error(401, 'Authentication required');
    return actor;
  }

  /** Non-admins only ever see their own campaigns. */
  private ownerScope(): SQL | undefined {
    const actor = this.requireActor();
    return isAdmin(actor.role) ? undefined : eq(campaign.userId, actor.id);
  }

  async list(filter: CampaignListFilter) {
    const actor = this.requireActor();
    const conditions: SQL[] = [isNull(campaign.deletedAt)];

    if (!isAdmin(actor.role) || filter.scope === 'mine') {
      conditions.push(eq(campaign.userId, actor.id));
    }
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      conditions.push(or(ilike(campaign.name, pattern), ilike(campaign.slug, pattern))!);
    }
    if (filter.status) conditions.push(eq(campaign.status, filter.status));
    if (filter.strategy) conditions.push(eq(campaign.rotationStrategy, filter.strategy));

    const where = and(...conditions);
    const [{ total }] = await db.select({ total: count() }).from(campaign).where(where);
    const totalPages = Math.max(1, Math.ceil(total / filter.pageSize));
    const page = Math.min(filter.page, totalPages);

    const orderBy = {
      created_desc: [desc(campaign.createdAt)],
      created_asc: [asc(campaign.createdAt)],
      name_asc: [asc(campaign.name)],
      clicks_desc: [desc(campaign.totalClicks)]
    }[filter.sort];

    const items = await db
      .select({
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        status: campaign.status,
        rotationStrategy: campaign.rotationStrategy,
        totalClicks: campaign.totalClicks,
        expiresAt: campaign.expiresAt,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        destinationCount: sql<number>`(select count(*)::int from ${campaignDestination} where ${campaignDestination.campaignId} = ${campaign.id})`,
        activeDestinationCount: sql<number>`(select count(*)::int from ${campaignDestination} where ${campaignDestination.campaignId} = ${campaign.id} and ${campaignDestination.isActive})`,
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email
      })
      .from(campaign)
      .innerJoin(user, eq(user.id, campaign.userId))
      .where(where)
      .orderBy(...orderBy, desc(campaign.id))
      .limit(filter.pageSize)
      .offset((page - 1) * filter.pageSize);

    return { items, total, page, pageSize: filter.pageSize, totalPages };
  }

  async get(id: string) {
    if (!z.uuid().safeParse(id).success) return null;
    const found = await db.query.campaign.findFirst({
      where: and(eq(campaign.id, id), isNull(campaign.deletedAt), this.ownerScope()),
      with: {
        destinations: { orderBy: [asc(campaignDestination.sortOrder)] },
        rules: true,
        tags: true
      }
    });
    return found ?? null;
  }

  private async requireCampaign(id: string): Promise<CampaignDetail> {
    const found = await this.get(id);
    if (!found) throw new CampaignError('not_found', 'Campaign not found');
    return found;
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    if (!isValidCustomSlug(slug)) return false;
    // Soft-deleted campaigns keep their slug, so they are included on purpose.
    const found = await db.query.campaign.findFirst({
      columns: { id: true },
      where: excludeId
        ? and(eq(campaign.slug, slug), ne(campaign.id, excludeId))
        : eq(campaign.slug, slug)
    });
    return !found;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<string> {
    if (!(await this.isSlugAvailable(slug, excludeId))) {
      throw new CampaignError('slug_taken', 'This slug is already in use', 'slug');
    }
    return slug;
  }

  private async generateUniqueSlug(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = generateSlug(7);
      if (await this.isSlugAvailable(slug)) return slug;
    }
    throw new Error('Could not generate a unique slug');
  }

  /** Destinations pointing back at this platform would create redirect loops. */
  private assertDestinationsAllowed(input: CampaignFormData) {
    const platformHosts = new Set([this.event.url.hostname.toLowerCase()]);
    try {
      if (PUBLIC_SITE_URL) platformHosts.add(new URL(PUBLIC_SITE_URL).hostname.toLowerCase());
    } catch {
      // Invalid PUBLIC_SITE_URL: fall back to the request host only.
    }

    input.destinations.forEach((destination, index) => {
      if (platformHosts.has(new URL(destination.url).hostname.toLowerCase())) {
        throw new CampaignError(
          'destination_self',
          'A destination cannot point to this platform',
          `destinations[${index}].url`
        );
      }
    });
  }

  private async runBatch(statements: [BatchStatement, ...BatchStatement[]]) {
    try {
      await db.batch(statements);
    } catch (cause) {
      if (isUniqueViolation(cause)) {
        throw new CampaignError('slug_taken', 'This slug is already in use', 'slug');
      }
      throw cause;
    }
  }

  async create(input: CampaignFormData): Promise<{ id: string; slug: string }> {
    const actor = this.requireActor();
    this.assertDestinationsAllowed(input);
    const slug = input.slug
      ? await this.assertSlugAvailable(input.slug)
      : await this.generateUniqueSlug();
    const id = crypto.randomUUID();

    await this.runBatch([
      db.insert(campaign).values({ id, userId: actor.id, slug, ...campaignColumns(input) }),
      db.insert(campaignDestination).values(
        input.destinations.map((destination, index) => ({
          campaignId: id,
          ...destinationColumns(destination, index)
        }))
      ),
      ...ruleAndTagInserts(id, input)
    ]);

    await invalidateCampaignCache(this.locals.redis, slug);
    return { id, slug };
  }

  async update(id: string, input: CampaignFormData): Promise<{ id: string; slug: string }> {
    const existing = await this.requireCampaign(id);
    this.assertDestinationsAllowed(input);
    const slug =
      input.slug && input.slug !== existing.slug
        ? await this.assertSlugAvailable(input.slug, id)
        : existing.slug;

    // Keep destination rows (and their click stats) when the form sends back a known id.
    // Unknown or repeated ids are treated as new destinations.
    const existingIds = new Set(existing.destinations.map((destination) => destination.id));
    const keptIds = new Set<string>();
    const kept: { id: string; destination: DestinationInput; index: number }[] = [];
    const added: { destination: DestinationInput; index: number }[] = [];
    input.destinations.forEach((destination, index) => {
      if (destination.id && existingIds.has(destination.id) && !keptIds.has(destination.id)) {
        keptIds.add(destination.id);
        kept.push({ id: destination.id, destination, index });
      } else {
        added.push({ destination, index });
      }
    });

    const now = new Date();
    await this.runBatch([
      db
        .update(campaign)
        .set({ ...campaignColumns(input), slug, updatedAt: now })
        .where(eq(campaign.id, id)),
      db
        .delete(campaignDestination)
        .where(
          keptIds.size
            ? and(
              eq(campaignDestination.campaignId, id),
              notInArray(campaignDestination.id, [...keptIds])
            )
            : eq(campaignDestination.campaignId, id)
        ),
      ...kept.map(({ id: destinationId, destination, index }) =>
        db
          .update(campaignDestination)
          .set({ ...destinationColumns(destination, index), updatedAt: now })
          .where(
            and(eq(campaignDestination.id, destinationId), eq(campaignDestination.campaignId, id))
          )
      ),
      ...(added.length
        ? [
          db.insert(campaignDestination).values(
            added.map(({ destination, index }) => ({
              campaignId: id,
              ...destinationColumns(destination, index)
            }))
          )
        ]
        : []),
      db.delete(campaignRule).where(eq(campaignRule.campaignId, id)),
      db.delete(campaignTag).where(eq(campaignTag.campaignId, id)),
      ...ruleAndTagInserts(id, input)
    ]);

    await invalidateCampaignCache(this.locals.redis, existing.slug, slug);
    return { id, slug };
  }

  async setStatus(id: string, status: CampaignStatus) {
    const existing = await this.requireCampaign(id);
    if (status === 'active' && !existing.destinations.some((destination) => destination.isActive)) {
      throw new CampaignError(
        'invalid_state',
        'An active campaign needs at least one active destination'
      );
    }
    await db
      .update(campaign)
      .set({ status, updatedAt: new Date() })
      .where(eq(campaign.id, id));
    await invalidateCampaignCache(this.locals.redis, existing.slug);
  }

  /** Soft delete: stats are kept and the slug is never handed out again. */
  async remove(id: string) {
    const existing = await this.requireCampaign(id);
    const now = new Date();
    await db
      .update(campaign)
      .set({ deletedAt: now, status: 'archived', updatedAt: now })
      .where(eq(campaign.id, id));
    await invalidateCampaignCache(this.locals.redis, existing.slug);
  }

  async duplicate(id: string) {
    const form = campaignToForm(await this.requireCampaign(id));
    return this.create({
      ...form,
      name: `${form.name} (copy)`.slice(0, 160),
      slug: '',
      status: 'draft',
      destinations: form.destinations.map(({ id: _id, ...destination }) => destination)
    });
  }
}
