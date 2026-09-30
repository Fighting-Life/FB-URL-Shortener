import { isAdmin } from '$lib/middleware/rules';
import { platformSettingsSchema } from '$lib/utils/validators';
import { error, fail } from '@sveltejs/kit';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals }) => {
  const { user, session, setting } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Settings',
    robots: 'noindex, nofollow'
  });

  if (!isAdmin(user?.role ?? null)) {
    throw error(403, {
      message: 'You do not have permission to access this resource',
      code: 'FORBIDDEN'
    });
  }

  const form = await superValidate({
    site_name: setting?.site_name ?? '',
    site_tagline: setting?.site_tagline ?? '',
    site_logo: setting?.site_logo ?? '',
    site_favicon: setting?.site_favicon ?? '',
    site_meta_title: setting?.site_meta_title ?? '',
    site_meta_description: setting?.site_meta_description ?? '',
    site_url: setting?.site_url ?? '',
    site_og_image: setting?.site_og_image ?? '',
    site_og_title: setting?.site_og_title ?? '',
    site_og_description: setting?.site_og_description ?? '',
    site_keywords: setting?.site_keywords ?? '',
    enable_register: setting?.enable_register ?? true,
  }, zod4(platformSettingsSchema));

  return {
    ...pageMetaTags,
    user,
    session,
    setting,
    form
  }
}
export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(platformSettingsSchema))
    if (!form.valid) {
      return fail(400, {
        form,
        message: Object.values(form.errors).flat().join(', ')
      })
    }

    const response = await locals.helper?.setting.updateSettings(form.data)
    if (response instanceof Error) {
      return fail(400, {
        form,
        message: response.message
      })
    }

    return {
      success: true,
      message: 'Settings updated successfully',
      form
    }
  }
} satisfies Actions;