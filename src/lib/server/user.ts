import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import type { RequestEvent } from '@sveltejs/kit';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { ServerBase } from './server.js';
const USER_PAGE_SIZES = new Set([10, 20, 50]);

export class UserService extends ServerBase {
  constructor(protected readonly event: RequestEvent) {
    super(event);
  }
  async getUserById(id: string) {
    return await this.event.locals.db?.query.user.findFirst({ where: eq(user.id, id) });
  }
  async getUserByEmail(email: string) {
    return await this.event.locals.db?.query.user.findFirst({ where: eq(user.email, email) });
  }
  async updateAvatar(userId: string, avatar?: string | null): Promise<void | Error> {
    try {
      await this.event.locals.db?.update(user).set({ image: avatar }).where(eq(user.id, userId));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listManagedUsers(filters: {
    query?: string;
    role?: 'admin' | 'user';
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const pageSize = USER_PAGE_SIZES.has(Number(filters.pageSize)) ? Number(filters.pageSize) : 20;
    const page = Math.max(1, Number(filters.page) || 1);
    const conditions = [];
    const query = filters.query?.trim();
    if (query) {
      conditions.push(
        or(
          ilike(user.name, `%${query}%`),
          ilike(user.email, `%${query}%`),
          ilike(user.username, `%${query}%`)
        )!
      );
    }
    if (['user', 'admin'].includes(filters.role ?? '')) {
      conditions.push(eq(user.role, filters.role as 'user' | 'admin'));
    }
    if (['active', 'inactive', 'banned'].includes(filters.status ?? '')) {
      conditions.push(eq(user.status, filters.status as 'active' | 'inactive' | 'banned'));
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(user).where(where);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const items = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        image: user.image,
        role: user.role,
        status: user.status,
        banned: user.banned,
        banReason: user.banReason,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize);
    return { items, total, page: currentPage, pageSize, totalPages };
  }

  async getManagedUser(id: string) {
    const account = await db.query.user.findFirst({ where: eq(user.id, id) });
    if (!account) return null;

    return { account };
  }

  async changeUserRole(id: string, nextRole: 'user' | 'admin') {
    const target = await db.query.user.findFirst({ where: eq(user.id, id) });
    if (!target) return { ok: false as const, reason: 'not_found' as const };
    if (target.role === 'admin' && nextRole !== 'admin') {
      const [{ total }] = await db
        .select({ total: count() })
        .from(user)
        .where(eq(user.role, 'admin'));
      if (total <= 1) return { ok: false as const, reason: 'last_superadmin' as const };
    }

    await db.batch([
      db.update(user).set({ role: nextRole, updatedAt: new Date() }).where(eq(user.id, id)),
    ] as Parameters<typeof db.batch>[0]);
    return { ok: true as const, previousRole: target.role };
  }

  async setUserBan(id: string, banned: boolean, reason?: string) {
    const target = await db.query.user.findFirst({ where: eq(user.id, id) });
    if (!target) return null;
    await db.batch([
      db
        .update(user)
        .set({
          banned,
          status: banned ? 'banned' : 'active',
          banReason: banned ? reason?.trim() || 'Administrative action' : null,
          banExpires: null,
          updatedAt: new Date()
        })
        .where(eq(user.id, id)),
      ...(banned ? [db.delete(session).where(eq(session.userId, id))] : [])
    ] as Parameters<typeof db.batch>[0]);
    return target;
  }
}