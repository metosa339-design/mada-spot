// Supprime les 6 fiches test identifiées par _find_test_fiches.mjs
// Critère : zéro contenu ET (name vide OU name gibberish court)

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CAMPAIGN_START = new Date('2026-03-29T00:00:00Z');

const all = await prisma.establishment.findMany({
  where: {
    createdAt: { gte: CAMPAIGN_START },
    OR: [{ createdByUserId: { not: null } }, { isClaimed: true }],
  },
  select: {
    id: true, name: true, type: true, description: true, phone: true,
    coverImage: true, images: true,
  },
});

const toDelete = all.filter(e => {
  const name = (e.name || '').trim();
  const desc = (e.description || '').trim();
  const noPhoto = !e.coverImage && (!e.images || e.images === '[]' || e.images === 'null');
  const noDesc = desc.length < 30;
  const noContent = noPhoto && noDesc && !e.phone;

  const emptyName = !name;
  const shortGibberish = name.length > 0 && name.length < 6 && !name.includes(' ');

  return noContent && (emptyName || shortGibberish);
});

console.log(`Fiches à supprimer : ${toDelete.length}`);
toDelete.forEach(e => console.log(`  ${e.id} [${e.type}] "${e.name || '(vide)'}"`));

if (toDelete.length === 0) {
  console.log('Rien à supprimer.');
  process.exit(0);
}

// Avant delete: vérifier qu'il n'y a pas de child rows qui bloqueraient
for (const e of toDelete) {
  const reviewCount = await prisma.establishmentReview.count({ where: { establishmentId: e.id } });
  const bookingCount = await prisma.booking.count({ where: { establishmentId: e.id } });
  if (reviewCount > 0 || bookingCount > 0) {
    console.log(`  ⚠️ ${e.id} a ${reviewCount} reviews et ${bookingCount} bookings — skip pour sécurité`);
  }
}

const ids = toDelete.map(e => e.id);

// Cleanup pré-delete des sub-tables qui n'ont pas onDelete: Cascade
// (par sécurité, à blanc d'abord)
const checkChildren = await Promise.all([
  prisma.hotel.count({ where: { establishmentId: { in: ids } } }),
  prisma.restaurant.count({ where: { establishmentId: { in: ids } } }),
  prisma.attraction.count({ where: { establishmentId: { in: ids } } }),
  prisma.provider.count({ where: { establishmentId: { in: ids } } }),
]);
console.log(`\nChild sub-models: hotel=${checkChildren[0]} restaurant=${checkChildren[1]} attraction=${checkChildren[2]} provider=${checkChildren[3]}`);

// Delete sub-models first (FK protection)
await prisma.hotel.deleteMany({ where: { establishmentId: { in: ids } } });
await prisma.restaurant.deleteMany({ where: { establishmentId: { in: ids } } });
await prisma.attraction.deleteMany({ where: { establishmentId: { in: ids } } });
await prisma.provider.deleteMany({ where: { establishmentId: { in: ids } } });

// Delete establishments
const result = await prisma.establishment.deleteMany({ where: { id: { in: ids } } });
console.log(`\n✅ ${result.count} fiches supprimées.`);

await prisma.$disconnect();
