// Valide tous les établissements user-créés depuis la campagne :
//   moderationStatus -> "approved"
//   isActive         -> true
// Exclus : fiches dont le name est vide ou ne contient que des espaces
//          (afficheraient un trou visuel en prod).

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

// Cible : créées depuis campaign + user-related, état non-approved-active
const candidates = await prisma.establishment.findMany({
  where: {
    createdAt: { gte: CAMPAIGN_START },
    OR: [
      { createdByUserId: { not: null } },
      { isClaimed: true },
    ],
    NOT: { AND: [{ moderationStatus: 'approved' }, { isActive: true }] },
  },
  select: { id: true, name: true, type: true, moderationStatus: true, isActive: true },
});

const toUpdate = candidates.filter(e => e.name && e.name.trim().length > 0);
const skipped = candidates.filter(e => !e.name || e.name.trim().length === 0);

console.log(`Candidats : ${candidates.length}`);
console.log(`À updater : ${toUpdate.length}`);
console.log(`Skip (name vide) : ${skipped.length}`);
skipped.forEach(s => console.log(`  skip id=${s.id} type=${s.type} (${s.moderationStatus}, active=${s.isActive})`));

if (toUpdate.length === 0) {
  console.log('Rien à faire.');
  process.exit(0);
}

const result = await prisma.establishment.updateMany({
  where: { id: { in: toUpdate.map(e => e.id) } },
  data: { moderationStatus: 'approved', isActive: true },
});
console.log(`\n${result.count} établissements mis à jour (status=approved, isActive=true)`);

// Vérif post-update
const stillBad = await prisma.establishment.count({
  where: {
    createdAt: { gte: CAMPAIGN_START },
    OR: [{ createdByUserId: { not: null } }, { isClaimed: true }],
    NOT: { AND: [{ moderationStatus: 'approved' }, { isActive: true }] },
    name: { not: '' },
  },
});
console.log(`Restant à valider (hors noms vides) : ${stillBad}`);

await prisma.$disconnect();
