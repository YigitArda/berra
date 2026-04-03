import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('ChangeMe123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@berra.local' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@berra.local',
      passwordHash: hash,
      role: UserRole.ADMIN,
      bio: 'Staging admin user',
    },
  });

  await prisma.content.createMany({
    data: [
      { userId: admin.id, body: 'Seed content #1' },
      { userId: admin.id, body: 'Seed content #2' },
    ],
    skipDuplicates: true,
  });

  console.log('Prisma seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
