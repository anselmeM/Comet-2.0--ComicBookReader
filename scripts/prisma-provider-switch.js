const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local and .env files if process.env.DATABASE_URL is not set
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
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

const dbUrl = process.env.DATABASE_URL || '';
const directUrl = process.env.DIRECT_URL || '';

// We match and replace the datasource db block dynamically.
const datasourceRegex = /datasource\s+db\s*\{[^}]*\}/;

let newDatasource = '';
if (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')) {
  const useDirectUrl = directUrl ? 'env("DIRECT_URL")' : 'env("DATABASE_URL")';
  newDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = ${useDirectUrl}
}`;
  console.log(`🔄 Configuring Prisma for PostgreSQL. directUrl set to: ${directUrl ? 'DIRECT_URL' : 'DATABASE_URL (fallback)'}`);
  
  // Replace metadata type to Json for Postgres support
  schema = schema.replace(/metadata\s+String\?/g, 'metadata    Json?');
} else {
  // For SQLite, write the file path directly to avoid missing env var issues at build time
  const sqliteUrl = dbUrl.startsWith('file:') ? dbUrl : 'file:./dev.db';
  newDatasource = `datasource db {
  provider = "sqlite"
  url      = "${sqliteUrl}"
}`;
  console.log(`🔄 Configuring Prisma for SQLite (default/local) with URL: ${sqliteUrl}`);
  
  // Replace metadata type to String for SQLite compatibility
  schema = schema.replace(/metadata\s+Json\?/g, 'metadata    String?');
}

schema = schema.replace(datasourceRegex, newDatasource);
fs.writeFileSync(schemaPath, schema);
console.log('✅ Updated prisma/schema.prisma datasource config.');
