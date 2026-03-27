import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Constants
const COLLEGE_NAME = 'MIT World Peace University';
const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'admin@mit.edu.in';
const TEMP_PASSWORD = 'tempPassword123!';

async function main() {
  console.log('--- College Admin Seeder ---');
  console.log(`Checking if admin ${ADMIN_EMAIL} exists...`);

  const college = await prisma.college.upsert({
    where: { name: COLLEGE_NAME },
    update: {},
    create: {
      name: COLLEGE_NAME,
      domain: 'mit.edu.in',
    },
  });

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);

  await prisma.user.create({
    data: {
      collegeId: college.id,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      inviteToken: null,
      inviteTokenExpiry: null,
    },
  });

  console.log('Admin created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
