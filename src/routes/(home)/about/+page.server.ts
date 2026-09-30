import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, session } = locals;

  const pageMetaTags = definePageMetaTags({
    title: 'Bitfy — Multi-URL cloaking & rotating redirects, free',
    robots: 'index, follow',
    twitter: {
      cardType: 'summary_large_image',
      site: '@x_tube',
      image: '/logo.png',
      title: 'Bitfy — Multi-URL cloaking & rotating redirects, free'
    }
  });

  return {
    ...pageMetaTags,
    user,
    session,
  };
};