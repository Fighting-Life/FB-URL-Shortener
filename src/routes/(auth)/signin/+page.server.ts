import { loginSchema } from '$lib/utils/validators';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, session } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Sign In',
    robots: 'index, follow',
    twitter: {
      cardType: 'summary_large_image',
      site: '@x_tube',
      image: '/logo.png',
      title: 'Sign In'
    }
  });

  const form = await superValidate(zod4(loginSchema));

  return {
    ...pageMetaTags,
    user,
    session,
    form
  };
};
export const actions = {
  default: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(loginSchema));
    if (!form.valid) {
      return fail(400, {
        form,
        success: false,
        message: Object.values(form.errors).join(', ')
      });
    }

    const isEmail =
      form.data.identifier.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.identifier);

    try {
      if (!locals.auth) {
        throw new Error('Auth service is not available');
      }

      let authResponse: any = null;

      if (!isEmail) {
        authResponse = await locals.auth.api.signInUsername({
          headers: request.headers,
          body: {
            username: form.data.identifier,
            password: form.data.password,
            rememberMe: form.data.remember
          }
        });
      } else {
        authResponse = await locals.auth.api.signInEmail({
          headers: request.headers,
          body: {
            email: form.data.identifier,
            password: form.data.password,
            rememberMe: form.data.remember
          }
        });
      }

      if (authResponse && 'twoFactorRedirect' in authResponse) {
        return {
          success: true,
          twoFactorRequired: true,
          twoFactorMethods: authResponse.twoFactorMethods ?? [],
          message: 'Two-factor authentication diperlukan.',
          form
        };
      }

      if (!authResponse?.user) {
        throw new Error('User not found or please sign up first');
      }

      return {
        success: true,
        twoFactorRequired: false,
        message: 'Signin successful',
        form
      };
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 403 && isEmail) {
          await locals.auth?.api.sendVerificationOTP({
            body: {
              email: form.data.identifier,
              type: 'email-verification'
            }
          });

          return {
            form,
            success: true,
            emailVerificationRequired: true,
            email: form.data.identifier,
            message: 'Please verify your email address first.'
          };
        }

        if (error.status === 403 && error.message?.includes('two_factor')) {
          return {
            success: true,
            twoFactorRequired: true,
            message: 'Two-factor authentication required.',
            form
          };
        }
        return fail(400, {
          form,
          success: false,
          message: error.message || 'Signin failed'
        });
      }
      if (error instanceof Error) {
        return fail(500, {
          form,
          success: false,
          message: error.message || 'Signin failed'
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
