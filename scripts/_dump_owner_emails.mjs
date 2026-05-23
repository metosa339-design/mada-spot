import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

const establishments = await prisma.establishment.findMany({
  select: { createdByUserId: true, claimedByUserId: true }
});

const userIds = new Set();
establishments.forEach(e => {
  if (e.createdByUserId) userIds.add(e.createdByUserId);
  if (e.claimedByUserId) userIds.add(e.claimedByUserId);
});

const users = await prisma.user.findMany({
  where: { id: { in: [...userIds] } },
  select: { email: true }
});

const emails = new Set();
users.forEach(u => { if (u.email) emails.add(u.email.toLowerCase()); });

const out = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/owner_emails.json';
fs.writeFileSync(out, JSON.stringify([...emails], null, 2));
console.log(`Establishments: ${establishments.length}`);
console.log(`Distinct owner userIds: ${userIds.size}`);
console.log(`Distinct owner emails: ${emails.size}`);
console.log(`Dumped to ${out}`);

await prisma.$disconnect();
