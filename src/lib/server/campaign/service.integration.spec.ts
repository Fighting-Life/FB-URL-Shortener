// Opt-in: hits the real database from DATABASE_URL.
//   RUN_DB_TESTS=1 pnpm exec vitest --run --project server service.integration
// Creates a throwaway user and removes it (cascading to its campaigns) afterwards.
import { campaignFormSchema, type CampaignFormInput } from '$lib/schemas/campaign';
import { db } from '$lib/server/db';
import { campaign, user } from '$lib/server/db/schema';
import type { RequestEvent } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CampaignError, CampaignService, campaignToForm } from './service';

const runId = crypto.randomUUID().slice(0, 8);

function serviceFor(actor: { id: string; role: 'user' | 'admin' }) {
  const event = {
    url: new URL('https://short.example.com/app/links'),
    locals: { user: actor, redis: undefined }
  } as unknown as RequestEvent;
  return new CampaignService(event);
}

const form = (input: CampaignFormInput) => campaignFormSchema.parse(input);

describe.skipIf(!process.env.RUN_DB_TESTS)('CampaignService (database)', { timeout: 60_000 }, () => {
  const userIds: string[] = [];
  let owner: CampaignService;
  let stranger: CampaignService;

  beforeAll(async () => {
    const rows = await db
      .insert(user)
      .values([
        { name: `it-owner-${runId}`, email: `it-owner-${runId}@example.test` },
        { name: `it-stranger-${runId}`, email: `it-stranger-${runId}@example.test` }
      ])
      .returning({ id: user.id });
    userIds.push(...rows.map((row) => row.id));
    owner = serviceFor({ id: rows[0].id, role: 'user' });
    stranger = serviceFor({ id: rows[1].id, role: 'user' });
  });

  afterAll(async () => {
    if (userIds.length) await db.delete(user).where(inArray(user.id, userIds));
  });

  it('runs the full campaign lifecycle', async () => {
    const created = await owner.create(
      form({
        name: 'Integration campaign',
        rotationStrategy: 'percentage',
        destinations: [
          { url: 'https://a.example.com/?ref=1', weight: 70 },
          { url: 'https://b.example.com/', weight: 30 }
        ],
        rules: { geo: { mode: 'allow', values: ['ID', 'ID', 'MY'] } },
        tags: [{ provider: 'fb_pixel', tagId: '123456789012345' }]
      })
    );
    expect(created.slug).toHaveLength(7);

    const stored = await owner.get(created.id);
    expect(stored?.destinations.map((d) => d.url)).toEqual([
      'https://a.example.com/?ref=1',
      'https://b.example.com/'
    ]);
    expect(stored?.rules).toMatchObject([{ type: 'geo', mode: 'allow', values: ['ID', 'MY'] }]);
    expect(stored?.tags).toHaveLength(1);

    // Ownership: other users can't see or modify it.
    expect(await stranger.get(created.id)).toBeNull();
    await expect(stranger.remove(created.id)).rejects.toMatchObject({ code: 'not_found' });

    // Update keeps the first destination row, drops the second, adds a new one.
    const edit = campaignToForm(stored!);
    const keptId = edit.destinations[0].id;
    await owner.update(
      created.id,
      form({
        ...edit,
        slug: `it-${runId}`,
        destinations: [
          { ...edit.destinations[0], weight: 50 },
          { url: 'https://c.example.com/', weight: 50 }
        ],
        rules: { device: { values: ['desktop'] } },
        tags: []
      })
    );
    const updated = await owner.get(created.id);
    expect(updated?.slug).toBe(`it-${runId}`);
    expect(updated?.destinations.map((d) => [d.url, d.weight])).toEqual([
      ['https://a.example.com/?ref=1', 50],
      ['https://c.example.com/', 50]
    ]);
    expect(updated?.destinations[0].id).toBe(keptId);
    expect(updated?.rules.map((r) => r.type)).toEqual(['device']);
    expect(updated?.tags).toEqual([]);

    await owner.setStatus(created.id, 'active');
    const copy = await owner.duplicate(created.id);
    const copied = await owner.get(copy.id);
    expect(copied).toMatchObject({ name: 'Integration campaign (copy)', status: 'draft' });
    expect(copied?.destinations).toHaveLength(2);

    const list = await owner.list({
      q: 'Integration',
      sort: 'created_desc',
      page: 1,
      pageSize: 20,
      scope: 'mine',
      status: undefined,
      strategy: undefined
    });
    expect(list.total).toBe(2);
    expect(list.items[0]).toMatchObject({ destinationCount: 2, activeDestinationCount: 2 });
    expect(
      (await stranger.list({ ...list, q: '', sort: 'created_desc', scope: 'all' })).total
    ).toBe(0);

    // Soft delete hides the campaign but keeps the slug reserved.
    await owner.remove(created.id);
    expect(await owner.get(created.id)).toBeNull();
    expect(await owner.isSlugAvailable(`it-${runId}`)).toBe(false);
    const [row] = await db.select().from(campaign).where(eq(campaign.id, created.id));
    expect(row.deletedAt).toBeInstanceOf(Date);
  });

  it('rejects taken slugs and self-referencing destinations', async () => {
    const first = await owner.create(
      form({
        name: 'Slug owner',
        slug: `taken-${runId}`,
        destinations: [{ url: 'https://a.example.com' }]
      })
    );
    expect(first.slug).toBe(`taken-${runId}`);

    await expect(
      stranger.create(
        form({
          name: 'Slug thief',
          slug: `taken-${runId}`,
          destinations: [{ url: 'https://a.example.com' }]
        })
      )
    ).rejects.toMatchObject({ code: 'slug_taken', path: 'slug' });

    const selfLoop = owner.create(
      form({
        name: 'Loop',
        destinations: [{ url: 'https://a.example.com' }, { url: 'https://SHORT.example.com/x' }]
      })
    );
    await expect(selfLoop).rejects.toBeInstanceOf(CampaignError);
    await expect(selfLoop).rejects.toMatchObject({
      code: 'destination_self',
      path: 'destinations[1].url'
    });
  });
});
