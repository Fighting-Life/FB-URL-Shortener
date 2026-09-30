import { campaignFormSchema } from '$lib/schemas/campaign';
import { CampaignError, campaignToForm } from '$lib/server/campaign/service';
import { error, fail } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { id } = params;

  const campaign = await locals.helper!.campaigns.get(id);
  if (!campaign) {
    error(404, { message: 'Campaign not found', code: 'NOT_FOUND' });
  }

  const formData = campaignToForm(campaign);
  const form = await superValidate(formData, zod4(campaignFormSchema));

  return {
    user: locals.user,
    setting: locals.setting,
    campaign,
    form
  };
};

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    const { id } = params;
    const form = await superValidate(request, zod4(campaignFormSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await locals.helper!.campaigns.update(id, form.data);
    } catch (err) {
      if (err instanceof CampaignError) {
        if (err.path === 'slug') {
          return setError(form, 'slug', err.message);
        }
        return fail(400, { form, message: err.message });
      }
      return fail(500, { form, message: 'An unexpected error occurred' });
    }

    return message(form, 'Campaign updated successfully!');
  }
};
