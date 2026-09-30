import type { MiddlewareRouteConfig } from '$lib/middleware/rules';
import type { AuthSession, AuthType, AuthUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { ServiceHelper } from '$lib/server/helper';
import type { RedisClient } from '$lib/server/redis';
import type { RequestEvent } from '@sveltejs/kit';

declare global {
  namespace App {
    interface Error {
      code?: string;
    }

    interface Locals {
      user?: AuthUser;
      session?: AuthSession;
      db: typeof db;
      auth?: AuthType;
      helper?: ServiceHelper;
      redis?: RedisClient;
      setting?: SiteSetting;
      safeGetSettings?: () => Promise<SiteSetting>;
    }

    interface PageData {
      user?: AuthUser | null;
      session?: AuthSession;
      success?: boolean;
      errors?: {
        code: string;
        message: string;
        details?: unknown;
      };
      messages?: string;
    }
  }

  interface RequestHandlerParams {
    event: RequestEvent;
    resolve: (event: RequestEvent) => MaybePromise<Response>;
    isAuthenticated: boolean;
    role?: AuthUser['role'] | null;
    routeRule?: MiddlewareRouteConfig;
    method: string;
    pathname: string;
  }

  interface ApiMiddlewareParams {
    event: RequestEvent;
    method: string;
    pathname: string;
    isAuthenticated: boolean;
    role?: AuthUser['role'] | null;
    routeRule?: MiddlewareRouteConfig;
  }
}

export { };

