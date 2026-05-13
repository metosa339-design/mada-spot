import { prisma } from '../src/lib/db';

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true, email: true, phone: true, totpEnabled: true, firstName: true, lastName: true },
  });
  console.log(JSON.stringify(admins, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
