import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Seeding College Admin...');
  await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      name: 'College Admin',
      email: 'admin@college.edu',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log('Seeding Faculty Coordinator...');
  await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: {},
    create: {
      name: 'Dr. Faculty Member',
      email: 'faculty@college.edu',
      passwordHash,
      role: Role.COORDINATOR,
    },
  });

  console.log('Seeding Club President...');
  await prisma.user.upsert({
    where: { email: 'president@college.edu' },
    update: {},
    create: {
      name: 'Student President',
      email: 'president@college.edu',
      passwordHash,
      role: Role.PRESIDENT,
    },
  });

  console.log('Seeding Club Member...');
  await prisma.user.upsert({
    where: { email: 'member@college.edu' },
    update: {},
    create: {
      name: 'Active Member',
      email: 'member@college.edu',
      passwordHash,
      role: Role.MEMBER,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
