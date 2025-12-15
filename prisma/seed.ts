import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { hash } from '@/lib/crypto';
import { Role } from '@prisma/client';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping admin seed.');
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists.');
    return;
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password),
      role: Role.ADMIN
    }
  });
  console.log('Seed admin created.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
