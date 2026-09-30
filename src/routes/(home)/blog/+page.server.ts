import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, session } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Blog',
    robots: 'index, follow',
    twitter: {
      cardType: 'summary_large_image',
      site: '@x_tube',
      image: '/logo.png',
      title: 'Blog'
    }
  });

  return {
    ...pageMetaTags,
    user,
    session,
  };
};