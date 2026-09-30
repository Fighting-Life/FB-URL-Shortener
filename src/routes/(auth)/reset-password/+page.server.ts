import { resetPasswordSchema } from '$lib/utils/validators';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const pageMetaTags = definePageMetaTags({
    title: 'Reset Password',
    robots: 'noindex, nofollow'
  });

  const form = await superValidate(
    {
      email: url.searchParams.get('email') ?? '',
      otp: '',
      password: '',
      confirmPassword: ''
    },
    zod4(resetPasswordSchema)
  );

  return {
    ...pageMetaTags,
    user: locals.user,
    session: locals.session,
    form
  };
};

export const actions = {
  default: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(resetPasswordSchema));

    if (!form.valid) {
      return fail(400, {
        form,
        success: false,
        message: Object.values(form.errors).join(', ')
      });
    }

    try {
      if (!locals.auth) {
        throw new Error('Auth service is not available');
      }

      const response = await locals.auth.api.resetPasswordEmailOTP({
        body: {
          email: form.data.email,
          otp: form.data.otp,
          password: form.data.password
        }
      });

      if (!response?.success) {
        throw new Error('Password reset failed');
      }

      return {
        form,
        success: true,
        message: 'Password reset successful.'
      };
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, {
          form,
          success: false,
          message: error.message || 'Password reset failed'
        });
      }

      return fail(500, {
        form,
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error'
      });
    }
  }
} satisfies Actions;
