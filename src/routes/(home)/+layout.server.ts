import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user, session, setting } = locals;
  return {
    user,
    session,
    setting
  };
};
