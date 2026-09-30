import { error } from '@sveltejs/kit';
import { definePageMetaTags } from 'svelte-meta-tags';

import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals, url }) => {
  const { user, session, setting } = locals;

  if (user?.role !== 'admin') {
    throw error(403, 'Forbidden')
  }

  const pageMetaTags = definePageMetaTags({
    title: 'Users',
    robots: 'noindex, nofollow'
  });

  return {
    ...pageMetaTags,
    user,
    session,
    setting,
  };
};
