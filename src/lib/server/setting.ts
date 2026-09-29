import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { ServerBase } from './server.js';
import { settings, auditLogs } from '$lib/server/db/schema';
import type { PlatformSettingsInput } from '@/utils/validators.js';
import { PUBLIC_SITE_URL } from '$env/static/public';

const DEFAULTS: PlatformSettingsInput = {
  site_name: 'Link Shift',
  site_tagline: 'Multi-URL cloaking & rotating',
  site_logo: '/logo.png',
  site_favicon: '/favicon.ico',
  site_meta_title: 'Link Shift',
  site_meta_description: 'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.',
  site_og_image: '/logo.png',
  site_og_title: 'LinkShift — Multi-URL cloaking & rotating redirects, free',
  site_og_description: 'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.',
  site_url: PUBLIC_SITE_URL || "http://localhost:5000",
  site_keywords: 'link cloaking, link rotation, link protection, link privacy, link security',
  enable_register: false,
}
export class SettingService extends ServerBase {
  constructor(protected readonly event: RequestEvent) {
    super(event);
  }
  async getSetting(key: string) {
    return await this.event.locals.db?.query.settings.findFirst({ where: eq(settings.key, key) });
  }
  async updateSettings(body: PlatformSettingsInput): Promise<void | Error> {
    try {
      if (!this.event.locals.db) {
        throw new Error('Database instance is not initialized');
      }

      const updatePromises = Object.entries(body).map(([key, value]) =>
        this.event.locals.db
          ?.insert(settings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value, updatedAt: new Date() }
          })
      );

      await Promise.all(updatePromises);

      await this.event.locals.db.insert(auditLogs).values({
        actorId: this.user?.id,
        action: 'settings.update',
        targetType: 'settings',
        targetId: 'platform',
        meta: body
      });
    } catch (error) {
      this.handleError(error);
    }
  }
  async updateSetting(key: string, value: string): Promise<void | Error> {
    try {
      await this.event.locals.db?.insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() }
        });
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async getSettings() {
    const rows = await this.event.locals.db?.query.settings.findMany();
    const map = new Map(rows?.map((r) => [r.key, r.value]) || []);

    const rawEnableRegister = map.get('enable_register');
    const initial: PlatformSettingsInput = {
      site_name: typeof map.get('site_name') === 'string' ? (map.get('site_name') as string) : DEFAULTS.site_name,
      site_tagline: typeof map.get('site_tagline') === 'string' ? (map.get('site_tagline') as string) : DEFAULTS.site_tagline,
      site_url: typeof map.get('site_url') === 'string' ? (map.get('site_url') as string) : DEFAULTS.site_url,
      site_logo: typeof map.get('site_logo') === 'string' ? (map.get('site_logo') as string) : DEFAULTS.site_logo,
      site_favicon: typeof map.get('site_favicon') === 'string' ? (map.get('site_favicon') as string) : DEFAULTS.site_favicon,
      site_meta_title: typeof map.get('site_meta_title') === 'string' ? (map.get('site_meta_title') as string) : DEFAULTS.site_meta_title,
      site_meta_description: typeof map.get('site_meta_description') === 'string' ? (map.get('site_meta_description') as string) : DEFAULTS.site_meta_description,
      site_og_image: typeof map.get('site_og_image') === 'string' ? (map.get('site_og_image') as string) : DEFAULTS.site_og_image,
      site_og_title: typeof map.get('site_og_title') === 'string' ? (map.get('site_og_title') as string) : DEFAULTS.site_og_title,
      site_og_description: typeof map.get('site_og_description') === 'string' ? (map.get('site_og_description') as string) : DEFAULTS.site_og_description,
      site_keywords: typeof map.get('site_keywords') === 'string' ? (map.get('site_keywords') as string) : DEFAULTS.site_keywords,
      enable_register:
        typeof rawEnableRegister === 'boolean'
          ? rawEnableRegister
          : rawEnableRegister === 'true'
            ? true
            : rawEnableRegister === 'false'
              ? false
              : DEFAULTS.enable_register,
    };

    return initial;
  }
}
