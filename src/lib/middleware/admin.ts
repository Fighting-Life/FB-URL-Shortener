import { buildSignInRedirect, hasRole, ROLE_LEVELS } from '$lib/middleware/rules';
import { error, redirect } from '@sveltejs/kit';

export const adminMiddleware = async (handler: RequestHandlerParams) => {
  const { event, resolve, isAuthenticated, routeRule, role } = handler;

  if (!isAuthenticated) {
    throw redirect(302, buildSignInRedirect(`${event.url.pathname}${event.url.search}`));
  }

  const allowedRoles = routeRule?.role ?? [ROLE_LEVELS.ADMIN];

  if (!hasRole(role, allowedRoles)) {
    throw error(403, {
      message: 'You do not have permission to access this resource',
      code: 'FORBIDDEN'
    });
  }

  return resolve(event);
};
