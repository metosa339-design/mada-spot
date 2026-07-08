import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { evaluateFiche } from '@/lib/crm/conformity';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/admin/crm/conformity — fiches + évaluation de conformité
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const sp = new URL(request.url).searchParams;
  const nonConformeOnly = sp.get('nonConformeOnly') !== '0';
  const type = sp.get('type') || 'all';
  const city = sp.get('city')?.trim().toLowerCase() || '';
  const search = sp.get('search')?.trim().toLowerCase() || '';

  const where: any = {};
  if (type !== 'all') where.type = type;

  const list = await prisma.establishment.findMany({
    where,
    select: {
      id: true, name: true, type: true, city: true, description: true, address: true,
      latitude: true, longitude: true, phone: true, email: true, website: true,
      coverImage: true, images: true, moderationStatus: true, isActive: true,
      claimedByUserId: true, createdByUserId: true,
    },
    take: 2000,
    orderBy: { updatedAt: 'desc' },
  });

  // E-mails des propriétaires
  const ownerIds = [...new Set(list.map((e) => e.claimedByUserId || e.createdByUserId).filter(Boolean) as string[])];
  const owners = ownerIds.length
    ? await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, email: true, firstName: true } })
    : [];
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  let items = list.map((e) => {
    const evalResult = evaluateFiche(e);
    const owner = ownerMap.get(e.claimedByUserId || e.createdByUserId || '');
    return {
      id: e.id,
      name: e.name,
      type: e.type,
      city: e.city,
      moderationStatus: e.moderationStatus,
      isActive: e.isActive,
      ownerEmail: owner?.email || e.email || null,
      ownerFirstName: owner?.firstName || null,
      score: evalResult.score,
      conforme: evalResult.conforme,
      failing: evalResult.failing.map((f) => ({ key: f.key, label: f.label })),
    };
  });

  if (nonConformeOnly) items = items.filter((i) => !i.conforme);
  if (city) items = items.filter((i) => (i.city || '').toLowerCase() === city);
  if (search) items = items.filter((i) => (i.name || '').toLowerCase().includes(search));

  items.sort((a, b) => a.score - b.score);

  const totalScanned = list.length;
  const nonConforme = list.filter((e) => !evaluateFiche(e).conforme).length;

  return apiSuccess({
    totalScanned,
    nonConforme,
    conforme: totalScanned - nonConforme,
    count: items.length,
    items: items.slice(0, 500),
  });
}
