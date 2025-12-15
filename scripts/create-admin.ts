import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { prisma } from '@/lib/prisma';
import { hash } from '@/lib/crypto';
import { Role } from '@prisma/client';

async function main() {
  const rl = readline.createInterface({ input, output });
  const email = await rl.question('Admin E-Mail: ');
  const password = await rl.question('Admin Passwort: ');
  rl.close();

  if (!email || !password) {
    throw new Error('Email und Passwort benötigt');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Benutzer existiert bereits.');
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password),
      role: Role.ADMIN
    }
  });

  console.log('Admin angelegt.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
