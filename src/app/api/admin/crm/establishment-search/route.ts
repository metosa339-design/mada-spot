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

  // On peut chercher par nom, ville, mais AUSSI par email / téléphone / WhatsApp / adresse
  // (le plus fiable pour confirmer qu'on cible la bonne personne : le payeur donne souvent son numéro).
  const digits = q.replace(/\D/g, '');
  const or: Record<string, unknown>[] = [
    { name: { contains: q, mode: 'insensitive' } },
    { city: { contains: q, mode: 'insensitive' } },
    { email: { contains: q, mode: 'insensitive' } },
    { address: { contains: q, mode: 'insensitive' } },
  ];
  if (digits.length >= 5) {
    or.push({ phone: { contains: digits } }, { phone2: { contains: digits } }, { whatsapp: { contains: digits } });
  }

  const items = await prisma.establishment.findMany({
    where: { OR: or },
    select: {
      id: true, name: true, city: true, district: true, type: true,
      isFeatured: true, isPremium: true, displayOrder: true,
      email: true, phone: true, whatsapp: true, address: true,
      isClaimed: true, claimedByUserId: true, verifiedByAgent: true, lastPhysicalVisit: true,
    },
    take: 12,
    orderBy: { name: 'asc' },
  });

  return apiSuccess({ items });
}
