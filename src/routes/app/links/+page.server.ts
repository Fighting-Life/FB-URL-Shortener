import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user, session, setting } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Links',
    robots: 'noindex, nofollow'
  });

  return {
    ...pageMetaTags,
    user,
    session,
    setting,
  };
};
