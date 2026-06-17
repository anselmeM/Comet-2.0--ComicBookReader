import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting load test seeding...');

  // 1. Create or update user-1
  const user = await prisma.user.upsert({
    where: { id: 'user-1' },
    update: {
      name: 'Test Load User',
      email: 'test-load@example.com',
      plan: 'FREE',
    },
    create: {
      id: 'user-1',
      name: 'Test Load User',
      email: 'test-load@example.com',
      plan: 'FREE',
    },
  });

  console.log(`👤 Upserted user: ${user.email} (id: ${user.id})`);

  // 2. Create 5 dummy comics for user-1
  const dummyComics = [
    { id: 'comic-load-1', title: 'Amazing Spider-Man Load Test #1', filehash: 'hash-load-1-abc' },
    { id: 'comic-load-2', title: 'Batman Load Test #2', filehash: 'hash-load-2-def' },
    { id: 'comic-load-3', title: 'X-Men Load Test #3', filehash: 'hash-load-3-ghi' },
    { id: 'comic-load-4', title: 'Watchmen Load Test #4', filehash: 'hash-load-4-jkl' },
    { id: 'comic-load-5', title: 'Saga Load Test #5', filehash: 'hash-load-5-mno' },
  ];

  for (const doc of dummyComics) {
    const comic = await prisma.comic.upsert({
      where: { id: doc.id },
      update: {
        title: doc.title,
        filehash: doc.filehash,
        pageCount: 30,
        userId: 'user-1',
      },
      create: {
        id: doc.id,
        title: doc.title,
        filehash: doc.filehash,
        pageCount: 30,
        userId: 'user-1',
      },
    });
    console.log(`📚 Upserted comic: ${comic.title} (id: ${comic.id})`);

    // Ensure reading progress exists for each to test progress API
    await prisma.readingProgress.upsert({
      where: { comicId: comic.id },
      update: {},
      create: {
        userId: 'user-1',
        comicId: comic.id,
        lastPage: 2,
        totalPages: 30,
        readStatus: 'READING',
      },
    });
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
