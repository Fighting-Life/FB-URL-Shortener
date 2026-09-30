import { registerSchema } from '$lib/utils/validators';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { definePageMetaTags } from 'svelte-meta-tags';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, session } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Sign Up',
    robots: 'index, follow',
    twitter: {
      cardType: 'summary_large_image',
      site: '@x_tube',
      image: '/logo.png',
      title: 'Sign Up'
    }
  });

  const form = await superValidate(zod4(registerSchema));

  return {
    ...pageMetaTags,
    user,
    session,
    form
  };
};
export const actions = {
  default: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(registerSchema));
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

      let username = generateValidUsername(form.data.email);

      const resUsername = await locals.auth.api.isUsernameAvailable({
        body: {
          username: username
        }
      });
      if (!resUsername?.available) {
        const suffix = `_${Math.floor(100 + Math.random() * 900)}`;
        username = `${username.slice(0, 30 - suffix.length)}${suffix}`;
      }

      const response = await locals.auth.api.signUpEmail({
        headers: request.headers,
        body: {
          name: form.data.name,
          email: form.data.email,
          username: username,
          displayUsername: username,
          password: form.data.password
        }
      });
      if (!response?.user) {
        throw new Error('User not found or please sign up first');
      }

      return {
        success: true,
        verifyEmailRequired: true,
        email: form.data.email,
        message: 'Sign up successful. Please verify your email.',
        form
      };
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, {
          form,
          success: false,
          message: error.message || 'Sign up failed'
        });
      }
      if (error instanceof Error) {
        return fail(500, {
          form,
          success: false,
          message: error.message || 'Sign up failed'
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


function generateValidUsername(email: string): string {
  let base = email.split('@')[0] ?? 'user';

  // Better Auth's displayUsernameValidator accepts only letters, numbers, _ and -.
  // Replace unsupported email characters (e.g. the dot in john.doe@gmail.com)
  // instead of passing an invalid displayUsername to signUpEmail.
  base = base.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (base.length < 3) {
    base = `user_${Math.floor(100 + Math.random() * 900)}`;
  }

  if (base.length > 30) {
    base = base.slice(0, 30);
  }

  if (/^[0-9_-]/.test(base)) {
    base = `u${base}`.slice(0, 30);
  }

  return base;
}