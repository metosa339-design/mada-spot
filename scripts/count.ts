import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.article.count({ where: { status: 'published' } });
  console.log('Total articles publies:', count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
