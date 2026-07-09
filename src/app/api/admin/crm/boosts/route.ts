import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { expireStaleBoosts, syncEstablishmentFeature } from '@/lib/crm/boost';

export const dynamic = 'force-dynamic';

// GET /api/admin/crm/boosts — liste (expire d'abord les périmés) + revenus
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  await expireStaleBoosts();

  const items = await prisma.boost.findMany({ orderBy: [{ status: 'asc' }, { endDate: 'asc' }], take: 200 });

  const activeCount = items.filter((b) => b.status === 'ACTIVE').length;
  const revenuePaid = items.filter((b) => b.isPaid).reduce((s, b) => s + (b.price || 0), 0);
  const revenuePending = items.filter((b) => !b.isPaid && b.status !== 'CANCELLED').reduce((s, b) => s + (b.price || 0), 0);

  return apiSuccess({ items, activeCount, revenuePaid, revenuePending });
}

// POST /api/admin/crm/boosts — créer un boost et l'appliquer
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const { establishmentId, type, durationDays, price, currency, isPaid, note } = body || {};
  if (!establishmentId) return apiError('establishmentId requis', 400);

  const est = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: { id: true, name: true },
  });
  if (!est) return apiError('Établissement introuvable', 404);

  const days = Math.min(Math.max(parseInt(durationDays, 10) || 7, 1), 365);
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Prix en Ariary, borné 5 000 – 1 000 000 AR
  const amount = Math.min(Math.max(typeof price === 'number' ? price : parseFloat(price) || 0, 5000), 1000000);
  // Priorité = AR par jour (plus cher pour moins de jours => passe devant)
  const computedPriority = Math.max(1, Math.round(amount / days));

  const boost = await prisma.boost.create({
    data: {
      establishmentId: est.id,
      establishmentName: est.name,
      type: ['featured', 'top_ranking', 'homepage'].includes(type) ? type : 'featured',
      priority: computedPriority,
      endDate,
      status: 'ACTIVE',
      price: amount,
      currency: currency || 'AR',
      isPaid: !!isPaid,
      note: note || null,
      createdById: admin.id,
    },
  });

  // Applique la mise en avant
  await syncEstablishmentFeature(est.id);

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'create',
    entityType: 'boost',
    entityId: boost.id,
    details: { establishment: est.name, type: boost.type, days },
    ...meta,
  }).catch(() => {});

  return apiSuccess(boost, 201);
}
