import {
  allowedWhenAuthenticated,
  authRoutes,
  buildSignInRedirect,
  hasRole,
  matchesAnyRoute,
  sanitizeRedirectTarget
} from '$lib/middleware/rules';
import { redirect } from '@sveltejs/kit';
export const authMiddleware = async (handler: RequestHandlerParams) => {
  const { event, resolve, isAuthenticated, method, pathname } = handler;

  if (isAuthenticated) {
    const isAuthPage =
      matchesAnyRoute(pathname, authRoutes) && !matchesAnyRoute(pathname, allowedWhenAuthenticated);

    if (isAuthPage) {
      const redirectTo = sanitizeRedirectTarget(event.url.searchParams.get('redirect'));
      throw redirect(302, redirectTo);
    }
  }

  if (method !== 'GET' && method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  return resolve(event);
};

export const authenticatedAppMiddleware = async (handler: RequestHandlerParams) => {
  const { event, resolve, isAuthenticated, routeRule, role } = handler;

  if (!isAuthenticated) {
    throw redirect(302, buildSignInRedirect(`${event.url.pathname}${event.url.search}`));
  }

  if (
    routeRule?.role &&
    !hasRole(role, routeRule.role)
  ) {
    throw redirect(302, '/app');
  }

  return resolve(event);
};
