import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { logger } from '@/lib/logger';

// GET /api/admin/events - List all events (admin)
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const where: Record<string, unknown> = {};

    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: where as any,
        include: {
          establishment: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.event.count({ where: where as any }),
    ]);

    return NextResponse.json({ success: true, events, total });
  } catch (error) {
    logger.error('Error fetching admin events:', error);
    return apiError('Erreur serveur', 500);
  }
}

const VALID_CATEGORIES = ['FESTIVAL', 'CULTURAL', 'SPORT', 'NATURE', 'MARKET', 'OTHER'];
const VALID_EVENT_TYPES = ['EVENT', 'PROMOTION', 'ADVERTISEMENT'];
const VALID_BADGES = ['NOUVEAU', 'PROMO', 'EXCLUSIF', 'OFFICIEL'];
const VALID_AUDIENCES = ['ALL', 'TRAVELERS', 'PROVIDERS'];

function slugify(title: string, city: string): string {
  const base = `${title}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base + '-' + Date.now().toString(36);
}

// POST /api/admin/events - Créer un événement/promo/pub (admin, publié directement)
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const body = await request.json().catch(() => null);
  if (!body) return apiError('JSON invalide', 400);

  if (!body.title?.trim()) return apiError('Le titre est requis', 400);
  if (!body.startDate) return apiError('La date de début est requise', 400);
  const startDate = new Date(body.startDate);
  if (isNaN(startDate.getTime())) return apiError('Date de début invalide', 400);
  if (!body.city?.trim()) return apiError('La ville est requise', 400);
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) return apiError('Catégorie invalide', 400);

  let endDate: Date | null = null;
  if (body.endDate) {
    endDate = new Date(body.endDate);
    if (isNaN(endDate.getTime())) return apiError('Date de fin invalide', 400);
    if (endDate < startDate) return apiError('La date de fin doit être après la date de début', 400);
  }

  try {
    const event = await prisma.event.create({
      data: {
        title: body.title.trim(),
        slug: slugify(body.title.trim(), body.city.trim()),
        description: body.description?.trim() || null,
        startDate,
        endDate,
        location: body.location?.trim() || null,
        city: body.city.trim(),
        region: body.region?.trim() || null,
        category: body.category,
        coverImage: body.coverImage?.trim() || null,
        organizer: body.organizer?.trim() || null,
        establishmentId: body.establishmentId || null,
        status: 'APPROVED',
        eventType: body.eventType && VALID_EVENT_TYPES.includes(body.eventType) ? body.eventType : 'EVENT',
        badge: body.badge && VALID_BADGES.includes(body.badge) ? body.badge : null,
        isPinned: Boolean(body.isPinned),
        targetAudience: body.targetAudience && VALID_AUDIENCES.includes(body.targetAudience) ? body.targetAudience : 'ALL',
        ctaLabel: body.ctaLabel?.trim() || null,
        ctaLink: body.ctaLink?.trim() || null,
        isPromotion: Boolean(body.isPromotion),
        priorityScore: Math.min(Math.max(parseInt(body.priorityScore, 10) || 0, 0), 10),
        linkedProductType: body.linkedProductType?.trim() || null,
        linkedProductId: body.linkedProductId?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    logger.error('Error creating admin event:', error);
    return apiError('Erreur serveur', 500);
  }
}
