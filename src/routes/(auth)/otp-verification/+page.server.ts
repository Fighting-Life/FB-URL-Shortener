
import { otpVerificationSchema } from '$lib/utils/validators';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const pageMetaTags = definePageMetaTags({
    title: 'Verify Email',
    robots: 'noindex, nofollow'
  });

  const form = await superValidate(
    {
      email: url.searchParams.get('email') ?? '',
      otp: ''
    },
    zod4(otpVerificationSchema)
  );

  return {
    ...pageMetaTags,
    user: locals.user,
    session: locals.session,
    form
  };
};

export const actions = {
  verify: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(otpVerificationSchema));

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

      const response = await locals.auth.api.verifyEmailOTP({
        headers: request.headers,
        body: {
          email: form.data.email,
          otp: form.data.otp
        }
      });

      if (!response?.status) {
        throw new Error('Email verification failed');
      }

      return {
        form,
        success: true,
        message: 'Email verified successfully.'
      };
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, {
          form,
          success: false,
          message: error.message || 'Email verification failed'
        });
      }

      return fail(500, {
        form,
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error'
      });
    }
  },
  resend: async ({ locals, request }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '');
    const form = await superValidate({ email, otp: '' }, zod4(otpVerificationSchema));

    try {
      if (!locals.auth) {
        throw new Error('Auth service is not available');
      }

      await locals.auth.api.sendVerificationOTP({
        body: {
          email,
          type: 'email-verification'
        }
      });

      return {
        form,
        success: true,
        message: 'Verification code sent.'
      };
    } catch (error) {
      return fail(400, {
        form,
        success: false,
        message: error instanceof Error ? error.message : 'Could not resend verification code'
      });
    }
  }
} satisfies Actions;
