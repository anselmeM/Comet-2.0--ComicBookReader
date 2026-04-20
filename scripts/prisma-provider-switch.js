const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

const dbUrl = process.env.DATABASE_URL || '';

// If we are deploying with a postgres database (like Render/Neon), switch the provider.
if (dbUrl.startsWith('postgres') && !schema.includes('provider = "postgresql"')) {
  console.log('🔄 Detected PostgreSQL DATABASE_URL. Switching Prisma provider to postgresql...');
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Updated prisma/schema.prisma to use postgresql.');
} else if (dbUrl.startsWith('file:') && !schema.includes('provider = "sqlite"')) {
  console.log('🔄 Detected SQLite DATABASE_URL. Switching Prisma provider to sqlite...');
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Updated prisma/schema.prisma to use sqlite.');
} else {
  console.log('✅ Prisma provider matches database URL type.');
}
