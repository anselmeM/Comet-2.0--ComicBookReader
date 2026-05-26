const fs = require('fs');
const path = require('path');

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
  newDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;
  console.log('🔄 Configuring Prisma for SQLite (default/local).');
  
  // Replace metadata type to String for SQLite compatibility
  schema = schema.replace(/metadata\s+Json\?/g, 'metadata    String?');
}

schema = schema.replace(datasourceRegex, newDatasource);
fs.writeFileSync(schemaPath, schema);
console.log('✅ Updated prisma/schema.prisma datasource config.');
