import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Aujourd'hui = depuis 00:00 local
const today = new Date(); today.setHours(0,0,0,0);

const usersToday = await prisma.user.count({ where: { createdAt: { gte: today } } });
const typedToday = await prisma.user.count({ where: { createdAt: { gte: today }, userType: { not: null } } });
const byType = await prisma.user.groupBy({
  by: ['userType'],
  _count: { _all: true },
  where: { createdAt: { gte: today }, userType: { not: null } }
});
const pendingToday = await prisma.pendingRegistration.count({ where: { createdAt: { gte: today } } });
const estabToday = await prisma.establishment.count({ where: { createdAt: { gte: today } } });

console.log(`Aujourd'hui (depuis ${today.toISOString().slice(0,10)} 00:00 local):`);
console.log(`  Nouveaux users : ${usersToday} (dont ${typedToday} typés pro)`);
byType.forEach(t => console.log(`    - ${t.userType}: ${t._count._all}`));
console.log(`  Nouveaux PendingRegistration : ${pendingToday}`);
console.log(`  Nouveaux établissements publiés : ${estabToday}`);

// 24h derniers (parce que les inscriptions de la nuit comptent aussi)
const last24h = new Date(Date.now() - 24*3600*1000);
const last24Typed = await prisma.user.count({ where: { createdAt: { gte: last24h }, userType: { not: null } } });
console.log(`\nDernières 24h : ${last24Typed} comptes pros typés`);

await prisma.$disconnect();
