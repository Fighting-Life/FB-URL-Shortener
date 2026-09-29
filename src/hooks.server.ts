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
import { ServiceHelper } from '@/server/helper';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const initializeLocals: Handle = async ({ event, resolve }) => {
  event.locals.db = db;
  event.locals.helper = new ServiceHelper(event);
  event.locals.auth = auth;
  return resolve(event);
};

const handleAuthAndRoutes: Handle = async ({ event, resolve }) => {
  const { url, request, locals } = event;
  const { pathname } = url;
  const method = request.method;

  if (matchesRoutePrefix(pathname, '/api/auth')) {
    return auth.handler(request);
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
