import { building } from '$app/environment';
import { adminMiddleware } from '$lib/middleware/admin';
import { apiMiddleware } from '$lib/middleware/api';
import { authMiddleware, authenticatedAppMiddleware } from '$lib/middleware/auth';
import {
  apiRouteRules,
  authRoutes,
  getRouteRule,
  matchesAnyRoute,
  matchesRoutePrefix,
  pageRouteRules,
  protectedAppRoutes,
  restrictedSuperAdminRoutes
} from '$lib/middleware/rules';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { RESERVED_SLUGS, SLUG_PATTERN } from '$lib/utils/slug';
import { ServiceHelper } from '@/server/helper';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';

/**
 * Returns true when the pathname looks like a campaign slug (e.g. /aBc12dE or /my-promo)
 * and should be dispatched directly to the redirect engine, bypassing session lookup.
 *
 * A slug path is a single segment: no sub-paths (/a/b), no known route prefixes.
 */
function isSlugPath(pathname: string): boolean {
  // Must be exactly one segment: /something
  const segment = pathname.startsWith('/') ? pathname.slice(1).replace(/\/$/, '') : '';
  if (!segment || segment.includes('/')) return false;
  if (!SLUG_PATTERN.test(segment)) return false;
  if (RESERVED_SLUGS.has(segment.toLowerCase())) return false;
  // Known app route prefixes that should never be treated as slugs
  const knownPrefixes = [
    'api', 'app', '_app', 'about', 'blog', 'contact', 'docs', 'faq',
    'signin', 'signup', 'signout', 'otp-verification', 'forgot-password',
    'reset-password', '2fa', 'privacy', 'terms', 'static',
  ];
  return !knownPrefixes.includes(segment.toLowerCase());
}

const initializeLocals: Handle = async ({ event, resolve }) => {
  // Fast-path: campaign redirect slugs skip full initialisation.
  // The route handler (src/routes/[slug=slug]/+server.ts) reads env/redis directly.
  if (isSlugPath(event.url.pathname)) {
    return resolve(event);
  }

  event.locals.db = db;
  event.locals.helper = new ServiceHelper(event);
  event.locals.auth = auth;
  event.locals.setting = await event.locals.helper.setting.getSettings();
  return resolve(event);
};

const handleAuthAndRoutes: Handle = async ({ event, resolve }) => {
  const { url, request, locals } = event;
  const { pathname } = url;
  const method = request.method;

  if (matchesRoutePrefix(pathname, '/api/auth')) {
    return auth.handler(request);
  }

  // Campaign slug fast-path — skip session lookup and route guards entirely.
  // The +server.ts handler already handles all redirect logic.
  if (isSlugPath(pathname)) {
    return resolve(event);
  }

  try {
    const authSession = await auth.api.getSession({ headers: request.headers });
    locals.session = authSession?.session;
    locals.user = authSession?.user;

    const role = locals.user?.role ?? null;
    const isAuthenticated = Boolean(locals.user);
    const isApiRoute = matchesRoutePrefix(pathname, '/api');
    const isAdminRoute = matchesAnyRoute(pathname, restrictedSuperAdminRoutes);
    const isAuthRoute = matchesAnyRoute(pathname, authRoutes);
    const isAppRoute = matchesAnyRoute(pathname, protectedAppRoutes);
    const routeRule = getRouteRule(pathname, isApiRoute ? apiRouteRules : pageRouteRules);
    const context = {
      event,
      resolve,
      isAuthenticated,
      role,
      routeRule,
      method,
      pathname
    };

    if (isApiRoute) {
      await apiMiddleware(context);
    } else if (isAuthRoute) {
      return await authMiddleware(context);
    } else if (isAdminRoute) {
      return await adminMiddleware(context);
    } else if (isAppRoute) {
      return await authenticatedAppMiddleware(context);
    }
  } catch (cause: unknown) {
    const caught = cause as { status?: number; body?: { code?: string; message?: string }; code?: string; message?: string };
    if (typeof caught.status === 'number' && caught.status >= 300 && caught.status < 400) {
      throw cause;
    }
    if (matchesRoutePrefix(pathname, '/api')) {
      const status = caught.status ?? 500;
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: caught.body?.code ?? caught.code ?? 'INTERNAL_ERROR',
            message: caught.body?.message ?? caught.message ?? 'An unexpected error occurred',
            status
          }
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw cause;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(initializeLocals, handleAuthAndRoutes);
