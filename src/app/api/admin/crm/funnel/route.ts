import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/crm/funnel — entonnoir d'acquisition prestataire (lecture seule)
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  // 1) Prospects par statut et par source
  const [byStatus, bySource, prospectsTotal] = await Promise.all([
    prisma.prospect.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.prospect.groupBy({ by: ['source'], _count: { _all: true } }),
    prisma.prospect.count(),
  ]);

  // 2) Comptes
  const [usersTotal, prosTotal] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { userType: { not: null } } }),
  ]);

  // 3) Établissements : propriétaires (claimed OU created) => pro "avec fiche"
  const allEst = await prisma.establishment.findMany({
    select: {
      claimedByUserId: true,
      createdByUserId: true,
      moderationStatus: true,
      isActive: true,
      reviewCount: true,
      _count: { select: { bookings: true } },
    },
  });

  const ownersWithFiche = new Set<string>();
  const ownersValidated = new Set<string>();
  const ownersActive = new Set<string>();
  let estApproved = 0;
  let estPending = 0;
  let estRejected = 0;

  for (const e of allEst) {
    const owner = e.claimedByUserId || e.createdByUserId || null;
    if (owner) ownersWithFiche.add(owner);
    if (e.moderationStatus === 'approved') estApproved++;
    else if (e.moderationStatus === 'pending_review') estPending++;
    else if (e.moderationStatus === 'rejected') estRejected++;
    if (owner && e.moderationStatus === 'approved' && e.isActive) ownersValidated.add(owner);
    if (owner && ((e._count?.bookings || 0) > 0 || (e.reviewCount || 0) > 0)) ownersActive.add(owner);
  }

  // 4) Statuts prospects normalisés en objet
  const statusMap: Record<string, number> = {};
  for (const s of byStatus) statusMap[s.status] = s._count._all;
  const sourceMap: Record<string, number> = {};
  for (const s of bySource) sourceMap[s.source] = s._count._all;

  const converted = statusMap['CONVERTED'] || 0;

  // 5) Entonnoir prestataire
  const withFiche = ownersWithFiche.size;
  const validated = ownersValidated.size;
  const active = ownersActive.size;

  const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

  const funnel = [
    { key: 'prospects', label: 'Prospects', count: prospectsTotal, ofPrevious: null as number | null },
    { key: 'contacted', label: 'Contactés', count: (statusMap['CONTACTED'] || 0) + (statusMap['ENGAGED'] || 0) + (statusMap['QUALIFIED'] || 0) + converted, ofPrevious: null },
    { key: 'inscrits', label: 'Inscrits (comptes pro)', count: prosTotal, ofPrevious: null },
    { key: 'fiche', label: 'Fiche créée', count: withFiche, ofPrevious: null },
    { key: 'validee', label: 'Fiche validée (en ligne)', count: validated, ofPrevious: null },
    { key: 'actif', label: 'Actif (réservation/avis)', count: active, ofPrevious: null },
  ];
  for (let i = 1; i < funnel.length; i++) {
    funnel[i].ofPrevious = pct(funnel[i].count, funnel[i - 1].count);
  }

  return apiSuccess({
    generatedAt: new Date().toISOString(),
    accounts: { usersTotal, prosTotal },
    fiches: {
      approved: estApproved,
      pending: estPending,
      rejected: estRejected,
      total: allEst.length,
    },
    owners: { withFiche, validated, active },
    prospects: {
      total: prospectsTotal,
      byStatus: statusMap,
      bySource: sourceMap,
      converted,
      conversionRate: pct(converted, prospectsTotal),
    },
    funnel,
  });
}
