import { campaignListFilterSchema } from '$lib/schemas/campaign';
import { CampaignError } from '$lib/server/campaign/service';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user, setting } = locals;

  const filter = campaignListFilterSchema.parse({
    q: url.searchParams.get('q') ?? '',
    status: url.searchParams.get('status') ?? undefined,
    strategy: url.searchParams.get('strategy') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    scope: url.searchParams.get('scope') ?? undefined
  });

  const campaigns = await locals.helper!.campaigns.list(filter);

  return {
    user,
    setting,
    campaigns,
    filter
  };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const data = await request.formData();
    const id = data.get('id') as string | null;
    if (!id) return fail(400, { message: 'ID is required' });

    try {
      await locals.helper!.campaigns.remove(id);
      return { success: true };
    } catch (err) {
      const message = err instanceof CampaignError ? err.message : 'Failed to delete campaign';
      return fail(500, { message });
    }
  },

  setStatus: async ({ request, locals }) => {
    const data = await request.formData();
    const id = data.get('id') as string | null;
    const status = data.get('status') as string | null;
    if (!id || !status) return fail(400, { message: 'ID and status are required' });

    try {
      await locals.helper!.campaigns.setStatus(id, status as never);
      return { success: true };
    } catch (err) {
      const message = err instanceof CampaignError ? err.message : 'Failed to update status';
      return fail(500, { message });
    }
  },

  duplicate: async ({ request, locals }) => {
    const data = await request.formData();
    const id = data.get('id') as string | null;
    if (!id) return fail(400, { message: 'ID is required' });

    try {
      await locals.helper!.campaigns.duplicate(id);
      return { success: true };
    } catch (err) {
      const message = err instanceof CampaignError ? err.message : 'Failed to duplicate campaign';
      return fail(500, { message });
    }
  }
};
