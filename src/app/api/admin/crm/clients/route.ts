import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// GET /api/admin/crm/clients
// Liste les Users role=CLIENT enrichis de stats CRM (conversations, dernière activité, points fidélité, réservations).
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || 'all'; // all | active | banned | inactive
  const sort = searchParams.get('sort') || 'newest';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  const where: any = { role: 'CLIENT' };
  if (status === 'active') Object.assign(where, { isActive: true, isBanned: false });
  if (status === 'banned') Object.assign(where, { isBanned: true });
  if (status === 'inactive') Object.assign(where, { isActive: false });

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const orderBy =
    sort === 'oldest' ? { createdAt: 'asc' as const } :
    sort === 'name' ? [{ firstName: 'asc' as const }, { lastName: 'asc' as const }] :
    sort === 'recent_activity' ? { lastLoginAt: 'desc' as const } :
    { createdAt: 'desc' as const };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        isBanned: true,
        emailVerified: true,
        userType: true,
        loyaltyPoints: true,
        createdAt: true,
        lastLoginAt: true,
        clientProfile: { select: { city: true, district: true } },
        _count: {
          select: {
            bookings: true,
            conversations: true,
            establishmentReviews: true,
            establishmentFavorites: true,
            contactNotes: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return apiSuccess({ items, total, limit, offset });
}
