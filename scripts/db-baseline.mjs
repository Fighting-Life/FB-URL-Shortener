// Marks existing Drizzle migrations as applied for a database whose tables were
// created outside `drizzle-kit migrate` (e.g. via `db:push` or manual SQL).
//
// Usage:
//   node scripts/db-baseline.mjs --to 0000_open_speed           # dry run
//   node scripts/db-baseline.mjs --to 0000_open_speed --apply   # write
//
// Only baseline migrations whose schema already exists in the database.
// Afterwards, run `pnpm db:migrate` to apply the remaining migrations.
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

config({ quiet: true });

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const toIndex = args.indexOf('--to');
const toTag = toIndex >= 0 ? args[toIndex + 1] : undefined;

if (!toTag) {
  console.error('Missing --to <migration_tag>, e.g. --to 0000_open_speed');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const migrationsDir = path.resolve('drizzle');
const journal = JSON.parse(fs.readFileSync(path.join(migrationsDir, 'meta/_journal.json'), 'utf8'));
const lastIndex = journal.entries.findIndex((entry) => entry.tag === toTag);
if (lastIndex < 0) {
  console.error(`Migration "${toTag}" not found in drizzle/meta/_journal.json`);
  process.exit(1);
}

// Same hash Drizzle's migrator computes: sha256 of the raw .sql file.
const entries = journal.entries.slice(0, lastIndex + 1).map((entry) => ({
  tag: entry.tag,
  createdAt: entry.when,
  hash: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(migrationsDir, `${entry.tag}.sql`)).toString())
    .digest('hex')
}));

const sql = neon(process.env.DATABASE_URL);

await sql.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
await sql.query(
  'CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'
);

const [{ total }] = await sql.query(
  'SELECT count(*)::int AS total FROM "drizzle"."__drizzle_migrations"'
);
if (total > 0) {
  console.error(
    `Aborting: __drizzle_migrations already has ${total} row(s). Baseline is only for an empty history.`
  );
  process.exit(1);
}

for (const entry of entries) {
  console.log(`${apply ? 'Marking' : '[dry run] Would mark'} ${entry.tag} as applied`);
}

if (!apply) {
  console.log('Re-run with --apply to write the migration history.');
  process.exit(0);
}

await sql.transaction(
  entries.map((entry) =>
    sql.query('INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)', [
      entry.hash,
      entry.createdAt
    ])
  )
);

console.log('Done. Now run: pnpm db:migrate');
