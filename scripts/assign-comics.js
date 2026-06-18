const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'test-agent-xx@example.com';
  console.log(`🔍 Searching for user: ${email}...`);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ User ${email} not found.`);
    process.exit(1);
  }

  console.log(`👤 Found user: ${user.email} (id: ${user.id}). Assigning comics...`);

  const dummyComics = [
    {
      id: 'comic-agent-1',
      title: 'Amazing Spider-Man Load Test #1',
      filehash: 'hash-agent-1-abc',
      syncStatus: 'SYNCED',
    },
    {
      id: 'comic-agent-2',
      title: 'Batman Load Test #2',
      filehash: 'hash-agent-2-def',
      syncStatus: 'PENDING',
    },
    {
      id: 'comic-agent-3',
      title: 'X-Men Load Test #3',
      filehash: 'hash-agent-3-ghi',
      syncStatus: 'ERROR',
    },
    {
      id: 'comic-agent-4',
      title: 'Watchmen Load Test #4',
      filehash: 'hash-agent-4-jkl',
      syncStatus: 'LOCAL',
    },
    {
      id: 'comic-agent-5',
      title: 'Saga Load Test #5',
      filehash: 'hash-agent-5-mno',
      syncStatus: 'SYNCED',
    },
  ];

  for (const doc of dummyComics) {
    const comic = await prisma.comic.upsert({
      where: { id: doc.id },
      update: {
        title: doc.title,
        filehash: doc.filehash,
        pageCount: 30,
        userId: user.id,
        syncStatus: doc.syncStatus,
        year: 2026,
      },
      create: {
        id: doc.id,
        title: doc.title,
        filehash: doc.filehash,
        pageCount: 30,
        userId: user.id,
        syncStatus: doc.syncStatus,
        year: 2026,
      },
    });
    console.log(`📚 Upserted comic: ${comic.title} (id: ${comic.id})`);

    await prisma.readingProgress.upsert({
      where: { comicId: comic.id },
      update: {},
      create: {
        userId: user.id,
        comicId: comic.id,
        lastPage: 15,
        totalPages: 30,
        readStatus: 'READING',
      },
    });
  }

  console.log('✅ Assigning comics completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
