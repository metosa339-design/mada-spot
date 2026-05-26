import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

const pros = await prisma.user.findMany({
  where: { createdAt: { gte: CAMPAIGN_START }, userType: { not: null } },
  select: { id: true, email: true, firstName: true, userType: true, createdAt: true, lastLoginAt: true }
});

const stats = {
  total: pros.length,
  with_active_estab: 0,
  with_inactive_estab: 0,
  with_no_estab: 0,
  never_logged_back: 0,
};

const buckets = { no_estab: [], inactive_estab: [], started_but_inactive: [] };

for (const u of pros) {
  const ests = await prisma.establishment.findMany({
    where: { OR: [{ createdByUserId: u.id }, { claimedByUserId: u.id }] },
    select: { id: true, name: true, isActive: true, moderationStatus: true, description: true, createdAt: true }
  });

  if (ests.length === 0) {
    stats.with_no_estab++;
    buckets.no_estab.push(u);
  } else if (ests.some(e => e.isActive)) {
    stats.with_active_estab++;
  } else {
    stats.with_inactive_estab++;
    buckets.inactive_estab.push({ ...u, ests });
  }

  if (!u.lastLoginAt || u.lastLoginAt.getTime() - u.createdAt.getTime() < 60000) {
    stats.never_logged_back++;
  }
}

console.log('=== Stats ===');
console.log(`Total pros typés       : ${stats.total}`);
console.log(`  Avec fiche active    : ${stats.with_active_estab}`);
console.log(`  Avec fiche inactive  : ${stats.with_inactive_estab} (créées mais désactivées/non validées)`);
console.log(`  AUCUNE fiche         : ${stats.with_no_estab}`);
console.log(`  Jamais reloggés      : ${stats.never_logged_back}`);

console.log('\n=== Pros SANS fiche (60 approx) ===');
console.log('Ancienneté : combien de jours depuis signup');
const byAge = { '<1j': 0, '1-3j': 0, '3-7j': 0, '7-15j': 0, '15-30j': 0, '>30j': 0 };
const now = Date.now();
buckets.no_estab.forEach(u => {
  const days = (now - u.createdAt.getTime()) / 86400000;
  if (days < 1) byAge['<1j']++;
  else if (days < 3) byAge['1-3j']++;
  else if (days < 7) byAge['3-7j']++;
  else if (days < 15) byAge['7-15j']++;
  else if (days < 30) byAge['15-30j']++;
  else byAge['>30j']++;
});
Object.entries(byAge).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n  Reloggés / jamais reloggés (parmi sans fiche):');
console.log(`    jamais reloggé : ${buckets.no_estab.filter(u => !u.lastLoginAt || u.lastLoginAt.getTime() - u.createdAt.getTime() < 60000).length}`);
console.log(`    reloggé        : ${buckets.no_estab.filter(u => u.lastLoginAt && u.lastLoginAt.getTime() - u.createdAt.getTime() >= 60000).length}`);

console.log('\n=== Fiches inactives ===');
buckets.inactive_estab.forEach(u => {
  u.ests.forEach(e => console.log(`  ${u.userType} "${e.name}" (mod=${e.moderationStatus}, active=${e.isActive}, desc=${e.description?'OUI':'NON'}, age=${((now-e.createdAt.getTime())/86400000).toFixed(0)}j)`));
});

await prisma.$disconnect();
