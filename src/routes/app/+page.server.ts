import { redirect } from '@sveltejs/kit';
import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals, url }) => {
  const { user, session, setting } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Dashboard',
    robots: 'noindex, nofollow'
  });

  return {
    ...pageMetaTags,
    user,
    session,
    setting,
  };
};
