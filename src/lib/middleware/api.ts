import {
  apiRouteRules,
  getRouteRule,
  hasRole,
  type HttpMethod,
  matchesAnyRoute,
  matchesRoutePrefix,
  publicApiRoutes
} from '$lib/middleware/rules';
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
export const apiMiddleware = async ({
  method,
  pathname,
  isAuthenticated,
  role,
  routeRule
}: ApiMiddlewareParams) => {

  if (!matchesRoutePrefix(pathname, '/api')) {
    return { allowed: true };
  }

  const rule = routeRule ?? getRouteRule(pathname, apiRouteRules);

  if (rule?.public || matchesAnyRoute(pathname, publicApiRoutes)) {
    return { allowed: true };
  }

  if (!isAuthenticated) {
    throw error(401, {
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  if (rule?.methods?.length && !rule.methods.includes(method as HttpMethod)) {
    throw error(405, {
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  if (rule?.role?.length && !hasRole(role, rule.role)) {
    throw error(403, {
      message: 'Insufficient permissions for this action',
      code: 'FORBIDDEN'
    });
  }

  return { allowed: true };
};

export const validateApiRequest = async (event: RequestEvent, schema?: any) => {
  if (event.request.method === 'GET' || event.request.method === 'DELETE') {
    return { valid: true };
  }

  try {
    const body = await event.request.json();

    if (schema) {
      // const result = schema.safeParse(body);
      // if (!result.success) {
      // 	throw error(400, {
      // 		message: 'Invalid request body',
      // 		code: 'VALIDATION_ERROR',
      // 		details: result.error.errors
      // 	});
      // }
      // return { valid: true, data: result.data };
    }

    return { valid: true, data: body };
  } catch (err) {
    throw error(400, {
      message: 'Invalid JSON body',
      code: 'INVALID_JSON'
    });
  }
};
