export const ROLE_LEVELS = {
  USER: 'user',
  ADMIN: 'admin'
} as const;

export type UserRole = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type MiddlewareRouteConfig = {
  public?: boolean;
  role?: UserRole[];
  methods?: HttpMethod[];
  redirectAuthenticatedTo?: string;
};
export type RouteRules = Record<string, MiddlewareRouteConfig>;

const ROLE_RANK: Record<UserRole, number> = {
  [ROLE_LEVELS.USER]: 0,
  [ROLE_LEVELS.ADMIN]: 1
};

export const allowedWhenAuthenticated = ['/signout'] as const;
export const authRoutes = [
  '/signin',
  '/signup',
  '/otp-verification',
  '/reset-password',
  '/2fa',
  '/forgot-password'
] as const;

export const protectedAppRoutes = ['/app'] as const;
export const restrictedSuperAdminRoutes = ['/app/settings', '/app/users', '/app/audit'] as const;

export const publicApiRoutes = ['/api/auth', '/api/public', '/api/link', '/api/embed'] as const;
export const adminApiRoutes = ['/api/admin', '/api/setting'] as const;
export const moderatorApiRoutes = ['/api/moderator'] as const;
export const userApiRoutes = ['/api/user', '/api/campaign'] as const;

export const pageRouteRules = {
  '/app/settings': {
    role: [ROLE_LEVELS.ADMIN],
  },
  '/app/users': {
    role: [ROLE_LEVELS.ADMIN]
  },
  '/app/audit': {
    role: [ROLE_LEVELS.ADMIN]
  },
  '/app': {
    role: [ROLE_LEVELS.USER, ROLE_LEVELS.ADMIN]
  }
} satisfies RouteRules;

export const apiRouteRules = {
  '/api/auth': { public: true },
  '/api/public': { public: true },
  '/api/link': { public: true },
  '/api/embed': { public: true },
  '/api/setting': {
    role: [ROLE_LEVELS.ADMIN],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  '/api/admin': {
    role: [ROLE_LEVELS.ADMIN],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  '/api/moderator': {
    role: [ROLE_LEVELS.ADMIN],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  '/api/user': {
    role: [ROLE_LEVELS.USER, ROLE_LEVELS.ADMIN]
  },
  '/api/campaign': {
    role: [ROLE_LEVELS.USER, ROLE_LEVELS.ADMIN]
  }
} satisfies RouteRules;

export function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function matchesAnyRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => matchesRoutePrefix(pathname, route));
}

export function isUser(roleLevel?: string | null): boolean {
  return roleLevel === ROLE_LEVELS.USER;
}
export function isAdmin(roleLevel?: string | null): boolean {
  return roleLevel === ROLE_LEVELS.ADMIN;
}

export function canManageUser(roleLevel?: string | null): boolean {
  return roleLevel === ROLE_LEVELS.ADMIN;
}

export function hasRole(
  currentRole: string | null | undefined,
  allowedRoles: readonly UserRole[] = []
): boolean {
  if (allowedRoles.length === 0) return true;
  if (!currentRole || !(currentRole in ROLE_RANK)) return false;
  return allowedRoles.includes(currentRole as UserRole);
}

export function hasMinimumRole(
  currentRole: string | null | undefined,
  minimumRole: UserRole
): boolean {
  if (!currentRole || !(currentRole in ROLE_RANK)) return false;
  return ROLE_RANK[currentRole as UserRole] >= ROLE_RANK[minimumRole];
}

export function hasPermissions(
  currentRole: string | null | undefined,
  userPermissions: readonly string[] = [],
  requiredPermissions: readonly string[] = []
): boolean {
  if (requiredPermissions.length === 0) return true;
  if (isAdmin(currentRole)) return true;

  const permissionSet = new Set(userPermissions);
  return requiredPermissions.every((permission) => permissionSet.has(permission));
}

export function getRouteRule(
  pathname: string,
  rules: RouteRules
): MiddlewareRouteConfig | undefined {
  const route = Object.keys(rules)
    .filter((candidate) => matchesRoutePrefix(pathname, candidate))
    .sort((a, b) => b.length - a.length)[0];

  return route ? rules[route] : undefined;
}

export function sanitizeRedirectTarget(
  target: string | null | undefined,
  fallback = '/app'
): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }

  return target;
}

export function buildSignInRedirect(pathname: string): string {
  return `/signin?redirect=${encodeURIComponent(pathname)}`;
}
