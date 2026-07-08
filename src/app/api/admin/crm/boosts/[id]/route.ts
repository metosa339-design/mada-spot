import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { syncEstablishmentFeature } from '@/lib/crm/boost';
import { logAudit, getRequestMeta } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/crm/boosts/[id] — marquer payé / éditer
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* optionnel */
  }

  const data: any = {};
  if (typeof body.isPaid === 'boolean') data.isPaid = body.isPaid;
  if (typeof body.note === 'string') data.note = body.note;

  const boost = await prisma.boost.update({ where: { id }, data }).catch(() => null);
  if (!boost) return apiError('Boost introuvable', 404);
  return apiSuccess(boost);
}

// DELETE /api/admin/crm/boosts/[id] — annuler le boost et retirer la mise en avant
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  const boost = await prisma.boost.findUnique({ where: { id } });
  if (!boost) return apiError('Boost introuvable', 404);

  await prisma.boost.update({ where: { id }, data: { status: 'CANCELLED' } });
  await syncEstablishmentFeature(boost.establishmentId);

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'cancel',
    entityType: 'boost',
    entityId: id,
    details: { establishment: boost.establishmentName },
    ...meta,
  }).catch(() => {});

  return apiSuccess({ cancelled: true });
}
