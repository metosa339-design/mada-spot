import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/crm/establishment-search?q=... — recherche d'établissements (pour les boosts)
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return apiSuccess({ items: [] });

  const items = await prisma.establishment.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, city: true, type: true, isFeatured: true, isPremium: true, displayOrder: true },
    take: 12,
    orderBy: { name: 'asc' },
  });

  return apiSuccess({ items });
}
