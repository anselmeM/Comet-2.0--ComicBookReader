const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Guards against committing the SQLite-flavored schema.prisma that
// scripts/prisma-provider-switch.js writes for local development.
// Production deploys build with a PostgreSQL DATABASE_URL and a SQLite
// schema committed to the repo would break them.

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function gitShow(rev, relPath) {
  try {
    return execSync(`git show ${rev}:${relPath}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

// Remove the datasource block and the metadata column type so we can compare
// schema logic independent of the provider flip.
function normalize(schema) {
  return (schema || '')
    .replace(/\r\n/g, '\n')
    .replace(/datasource\s+db\s*\{[^}]*\}/, 'DATASOURCE')
    .replace(/metadata\s+(Json|String)\?/g, 'metadata   META?')
    .trim();
}

const current = readFileSafe(schemaPath);
if (!current) {
  console.log('✅ prisma/schema.prisma not found, skipping guard.');
  process.exit(0);
}

const isSqlite = /provider\s*=\s*"sqlite"/.test(current);

if (!isSqlite) {
  console.log('✅ prisma/schema.prisma is PostgreSQL-flavored (safe to commit).');
  process.exit(0);
}

// The file is SQLite-flavored. If it matches the committed schema apart from
// the provider flip, it was auto-generated for local dev — restore it.
const committed = gitShow('HEAD', 'prisma/schema.prisma');
if (committed !== null && normalize(current) === normalize(committed)) {
  // core.autocrlf is typically true on Windows: git stores LF but checks out
  // CRLF. Write CRLF so the restored file matches the working-tree convention.
  const restored = committed.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  fs.writeFileSync(schemaPath, restored);
  console.log(
    '✅ Restored prisma/schema.prisma to the committed PostgreSQL version ' +
      '(the dev script had flipped it to SQLite).',
  );
  process.exit(0);
}

console.error(
  [
    '❌ prisma/schema.prisma is SQLite-flavored AND differs from the committed version.',
    '   The dev script flips this file for local development; committing it would break',
    '   production deploys. Resolve before committing:',
    '',
    '   git checkout -- prisma/schema.prisma',
  ].join('\n'),
);
process.exit(1);
