import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

// Établissements créés par des utilisateurs (pas seedés/importés depuis campagne)
const all = await prisma.establishment.findMany({
  where: {
    createdAt: { gte: CAMPAIGN_START },
    OR: [
      { createdByUserId: { not: null } },
      { isClaimed: true },
    ],
  },
  select: {
    id: true, name: true, type: true, moderationStatus: true, isActive: true,
    isClaimed: true, claimedByUserId: true, createdByUserId: true,
    createdAt: true, dataSource: true,
  },
});

console.log(`Établissements user-créés depuis ${CAMPAIGN_START.toISOString().slice(0,10)}: ${all.length}`);

// Breakdown
const byMod = {}, byActive = { active: 0, inactive: 0 };
all.forEach(e => {
  byMod[e.moderationStatus] = (byMod[e.moderationStatus] || 0) + 1;
  byActive[e.isActive ? 'active' : 'inactive'] += 1;
});
console.log('\nmoderationStatus:');
Object.entries(byMod).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
console.log('\nisActive:');
Object.entries(byActive).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

// Ceux qui ont besoin d'action
const needAction = all.filter(e => e.moderationStatus !== 'approved' || !e.isActive);
console.log(`\nÀ VALIDER (status != approved OR isActive=false): ${needAction.length}`);
needAction.forEach(e => console.log(`  [${e.moderationStatus}] active=${e.isActive} "${e.name}" type=${e.type} created=${e.createdAt.toISOString().slice(0,10)}`));

await prisma.$disconnect();
