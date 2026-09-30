import { twoFactorSchema } from '$lib/utils/validators';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const pageMetaTags = definePageMetaTags({
    title: 'Two-Factor Verification',
    robots: 'noindex, nofollow'
  });

  const form = await superValidate(zod4(twoFactorSchema));

  return {
    ...pageMetaTags,
    user: locals.user,
    session: locals.session,
    form
  };
};

export const actions = {
  verify: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(twoFactorSchema));

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

      const response = await locals.auth.api.verifyTwoFactorOTP({
        headers: request.headers,
        body: {
          code: form.data.otp,
          trustDevice: form.data.trustDevice
        }
      });

      if (!response?.token) {
        throw new Error('Two-factor verification failed');
      }

      return {
        form,
        success: true,
        message: 'Two-factor verification successful.'
      };
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, {
          form,
          success: false,
          message: error.message || 'Two-factor verification failed'
        });
      }

      return fail(500, {
        form,
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error'
      });
    }
  },
  send: async ({ locals, request }) => {
    const formData = await request.formData();
    const trustDevice = formData.get('trustDevice') === 'on';
    const form = await superValidate({ otp: '', trustDevice }, zod4(twoFactorSchema));

    try {
      if (!locals.auth) {
        throw new Error('Auth service is not available');
      }

      const response = await locals.auth.api.sendTwoFactorOTP({
        headers: request.headers,
        body: {
          trustDevice
        }
      });

      if (!response?.status) {
        throw new Error('Could not send two-factor code');
      }

      return {
        form,
        success: true,
        codeSent: true,
        message: 'Two-factor code sent.'
      };
    } catch (error) {
      return fail(400, {
        form,
        success: false,
        message: error instanceof Error ? error.message : 'Could not send two-factor code'
      });
    }
  }
} satisfies Actions;
