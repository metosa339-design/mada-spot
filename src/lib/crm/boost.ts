import { prisma } from '@/lib/db';

/**
 * Expire les boosts arrivés à échéance et retire la mise en avant
 * des établissements qui n'ont plus aucun boost actif.
 * Renvoie le nombre de boosts expirés.
 */
export async function expireStaleBoosts(): Promise<number> {
  const now = new Date();
  const stale = await prisma.boost.findMany({
    where: { status: 'ACTIVE', endDate: { lt: now } },
    select: { id: true, establishmentId: true, type: true },
  });
  if (stale.length === 0) return 0;

  await prisma.boost.updateMany({
    where: { id: { in: stale.map((b) => b.id) } },
    data: { status: 'EXPIRED' },
  });

  // Pour chaque établissement concerné, retirer la mise en avant s'il n'a plus de boost actif
  const estIds = [...new Set(stale.map((b) => b.establishmentId))];
  for (const estId of estIds) {
    await syncEstablishmentFeature(estId);
  }
  return stale.length;
}

/**
 * Aligne isFeatured/isPremium de l'établissement sur ses boosts ACTIVE restants.
 */
export async function syncEstablishmentFeature(establishmentId: string): Promise<void> {
  const active = await prisma.boost.findMany({
    where: { establishmentId, status: 'ACTIVE' },
    select: { type: true, priority: true },
  });
  const featured = active.length > 0;
  const premium = active.some((b) => b.type === 'homepage');
  // displayOrder (le public trie displayOrder DESC) = priorité max des boosts actifs, sinon 0.
  const displayOrder = featured ? Math.max(0, ...active.map((b) => b.priority || 0)) : 0;
  await prisma.establishment
    .update({
      where: { id: establishmentId },
      data: { isFeatured: featured, displayOrder, ...(premium ? { isPremium: true } : {}) },
    })
    .catch(() => {});
}
