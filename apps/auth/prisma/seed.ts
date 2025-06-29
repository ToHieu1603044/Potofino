import { PrismaClient } from '@prisma/client-auth';

const prisma = new PrismaClient();

async function main() {
  const existingUserRole = await prisma.role.findFirst({
    where: { name: 'system' },
  });

  if (!existingUserRole) {
    await prisma.role.create({
      data: {
        name: 'system',
        description: 'Default role for normal users',
      },
    });
    console.log('✅ Seeded default "user" role');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
