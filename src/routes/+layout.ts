import { createAppQueryClient } from '$lib/query/query.client.js';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  const { baseMetaTags, user, session, setting } = data;
  const queryClient = createAppQueryClient();

  return {
    baseMetaTags,
    user,
    session,
    setting,
    queryClient,
  };
}