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

// Only run database migrations for PostgreSQL. SQLite local dev uses `npm run db:push`
// to keep the schema in sync, and running `prisma migrate deploy` against a SQLite
// database whose migration history was created for PostgreSQL fails with P3019.
if (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')) {
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
} else {
  console.log(
    'ℹ️  SQLite detected — skipping prisma migrate deploy. Use `npm run db:push` to sync the local schema.',
  );
}
