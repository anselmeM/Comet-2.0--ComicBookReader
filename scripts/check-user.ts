import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'anselme.motcho@gmail.com';
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        failedAttempts: true,
        lockoutUntil: true,
      }
    });

    if (user) {
      console.log('User found:');
      console.log(JSON.stringify({
        ...user,
        hasPassword: !!user.password,
      }, null, 2));
    } else {
      console.log('User NOT found.');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
