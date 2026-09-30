
import { forgotPasswordSchema } from '$lib/utils/validators';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, session } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Forgot Password',
    robots: 'index, follow',
    twitter: {
      cardType: 'summary_large_image',
      site: '@x_tube',
      image: '/logo.png',
      title: 'Forgot Password'
    }
  });

  const form = await superValidate(zod4(forgotPasswordSchema));

  return {
    ...pageMetaTags,
    user,
    session,
    form
  };
};

export const actions = {
  default: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(forgotPasswordSchema));
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

      const response = await locals.auth.api.requestPasswordResetEmailOTP({
        body: {
          email: form.data.email
        }
      });
      if (!response?.success) {
        throw new Error('Password reset failed');
      }

      return {
        success: true,
        resetPasswordRequired: true,
        email: form.data.email,
        message: 'Password reset code sent',
        form
      };
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, {
          form,
          success: false,
          message: error.message || 'Password reset failed'
        });
      }
      if (error instanceof Error) {
        return fail(500, {
          form,
          success: false,
          message: error.message || 'Password reset email failed'
        });
      }
      return fail(500, {
        form,
        success: false,
        message: 'Unexpected error'
      });
    }
  }
} satisfies Actions;
