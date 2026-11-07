const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local and .env files if DATABASE_URL is not set.
// Mirrors scripts/prisma-provider-switch.js so this script is safe to run standalone.
function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const index = trimmed.indexOf('=');
          if (index > 0) {
            const key = trimmed.substring(0, index).trim();
            let val = trimmed.substring(index + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to read ${file}:`, err);
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  loadEnv();
}

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql');
// Deployment builds must not mutate the shared database: only Vercel production
// (or an explicit local opt-in) is allowed to run `prisma migrate deploy`. CI pull
// requests and Vercel previews build against whatever DATABASE_URL they are given,
// and previously applied PR migrations to the production database before review.
const isVercelProduction = process.env.VERCEL_ENV === 'production';
const explicitlyAllowed = process.env.ALLOW_DB_MIGRATE === 'true';

if (isPostgres && (isVercelProduction || explicitlyAllowed)) {
  console.log('🛢️  DATABASE_URL is PostgreSQL — running prisma migrate deploy...');
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    shell: true,
  });
  if (result.error) {
    console.error('❌ Failed to run prisma migrate deploy:', result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
} else if (isPostgres) {
  console.log(
    'ℹ️  Skipping prisma migrate deploy: only Vercel production (VERCEL_ENV=production) ' +
      'or ALLOW_DB_MIGRATE=true may mutate the database. Preview/CI builds never do.',
  );
} else {
  console.log(
    'ℹ️  SQLite detected — skipping prisma migrate deploy. Use `npm run db:push` to sync the local schema.',
  );
}
