import { campaignFormSchema } from '$lib/schemas/campaign';
import { CampaignError } from '$lib/server/campaign/service';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const form = await superValidate(zod4(campaignFormSchema));

  return {
    user: locals.user,
    setting: locals.setting,
    form
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(campaignFormSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await locals.helper!.campaigns.create(form.data);
    } catch (err) {
      if (err instanceof CampaignError) {
        if (err.path === 'slug') {
          return setError(form, 'slug', err.message);
        }
        return fail(400, { form, message: err.message });
      }
      return fail(500, { form, message: 'An unexpected error occurred' });
    }

    redirect(303, '/app/links');
  }
};
