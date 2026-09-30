import type { PlatformSettingsInput } from '@/utils/validators.js';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
const DEFAULTS: PlatformSettingsInput = {
  site_name: 'Bitfy',
  site_tagline: 'Multi-URL cloaking & rotating',
  site_logo: '/logo.png',
  site_favicon: '/favicon.ico',
  site_meta_title: 'Bitfy',
  site_meta_description:
    'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.',
  site_og_image: '/logo.png',
  site_og_title: 'Bitfy — Multi-URL cloaking & rotating redirects, free',
  site_og_description:
    'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.',
  site_url: 'https://links-shift.vercel.app/',
  site_keywords: 'link cloaking, link rotation, link protection, link privacy, link security',
  enable_register: false
};

async function main() {
  console.log('🚀 Initialize db...');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const client = neon(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });
  console.log('✅ Successfully connected to the database.');

  console.log('⏳ Starting the database seeding process...');

  console.log('⚒️ Adding Default Settings data...');
  const settingPromises = Object.entries(DEFAULTS).map(([key, value]) =>
    db
      ?.insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedAt: new Date() }
      })
  );
  await Promise.all(settingPromises);
  console.log('✅ Default Settings data added successfully!');

  console.log('✅ Database seeding process completed successfully!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
