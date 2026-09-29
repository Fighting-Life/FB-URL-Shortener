import type { RequestEvent } from '@sveltejs/kit';
import { ServerBase } from './server.js';
import { redirect } from '@sveltejs/kit';
import type { Role } from './auth';

export class SessionService extends ServerBase {
  constructor(protected readonly event: RequestEvent) {
    super(event);
  }
  async requireUser() {
    const session = await this.auth?.api.getSession({ headers: this.event.request.headers });
    if (!session) {
      throw redirect(302, '/login');
    }
    return session;
  }
  async requireAdmin() {
    const session = await this.requireUser();
    const role = session.user.role as Role | undefined;
    if (role !== 'superadmin' && role !== 'moderator') {
      throw redirect(302, '/');
    }
    return session;
  }
  async requireSuperadmin() {
    const session = await this.requireUser();
    if ((session.user.role as Role | undefined) !== 'superadmin') {
      throw redirect(302, '/admin');
    }
    return session;
  }
}
