import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { requireAuth, getAuthUser } from '@/lib/auth/middleware';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const VALID_CATEGORIES = ['FESTIVAL', 'CULTURAL', 'SPORT', 'NATURE', 'MARKET', 'OTHER'];
const VALID_EVENT_TYPES = ['EVENT', 'PROMOTION', 'ADVERTISEMENT'];
const VALID_BADGES = ['NOUVEAU', 'PROMO', 'EXCLUSIF', 'OFFICIEL'];
const VALID_AUDIENCES = ['ALL', 'TRAVELERS', 'PROVIDERS'];

function generateEventSlug(title: string, city: string, date: string): string {
  const base = `${title}-${city}-${date}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base + '-' + Date.now().toString(36);
}

// GET /api/events - List approved events (public)
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'read');
    if (!rateLimit.success) {
      return apiError('Trop de requêtes', 429);
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const where: Record<string, unknown> = {
      status: 'APPROVED',
      // Auto-expiration: hide events where endDate has passed
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    };

    // Filter by month/year
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
        where.startDate = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    }

    // Filter by category
    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    // Filter by city
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    // Filter by establishment
    const establishmentId = searchParams.get('establishmentId');
    if (establishmentId) {
      where.establishmentId = establishmentId;
    }

    // Filter by event type
    const eventType = searchParams.get('eventType');
    if (eventType && VALID_EVENT_TYPES.includes(eventType)) {
      where.eventType = eventType;
    }

    // Filter pinned only
    const pinnedOnly = searchParams.get('pinned');
    if (pinnedOnly === 'true') {
      where.isPinned = true;
    }

    // Target audience filtering based on authenticated user
    const user = await getAuthUser(request);
    if (user) {
      // Authenticated: show ALL + events targeted to their type
      const isProvider = !!user.userType; // HOTEL, RESTAURANT, ATTRACTION, PROVIDER
      where.targetAudience = {
        in: isProvider ? ['ALL', 'PROVIDERS'] : ['ALL', 'TRAVELERS'],
      };
    } else {
      // Not authenticated: only show events targeted to ALL
      where.targetAudience = 'ALL';
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
              coverImage: true,
            },
          },
        },
        orderBy: [
          { priorityScore: 'desc' },
          { isPinned: 'desc' },
          { startDate: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.event.count({ where: where as any }),
    ]);

    return NextResponse.json({ success: true, events, total });
  } catch (error) {
    logger.error('Error fetching events:', error);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/events - Create a new event (admin only)
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'write');
    if (!rateLimit.success) {
      return apiError('Trop de requêtes', 429);
    }

    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // Only admins can create events
    if (user.role !== 'ADMIN') {
      return apiError('Seuls les administrateurs peuvent créer des événements', 403);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Corps de requête JSON invalide', 400);
    }

    // CSRF validation
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return apiError('Token CSRF invalide', 403);
    }

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return apiError('Le titre est requis', 400);
    }

    if (!body.startDate) {
      return apiError('La date de début est requise', 400);
    }

    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) {
      return apiError('Date de début invalide', 400);
    }

    if (!body.city || typeof body.city !== 'string' || body.city.trim().length === 0) {
      return apiError('La ville est requise', 400);
    }

    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return apiError('Catégorie invalide', 400);
    }

    // Validate endDate if provided
    let endDate: Date | null = null;
    if (body.endDate) {
      endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return apiError('Date de fin invalide', 400);
      }
      if (endDate < startDate) {
        return apiError('La date de fin doit être après la date de début', 400);
      }
    }

    // Generate slug
    const dateStr = startDate.toISOString().split('T')[0];
    const slug = generateEventSlug(body.title.trim(), body.city.trim(), dateStr);

    const event = await prisma.event.create({
      data: {
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        startDate,
        endDate,
        location: body.location?.trim() || null,
        city: body.city.trim(),
        region: body.region?.trim() || null,
        category: body.category,
        coverImage: body.coverImage?.trim() || null,
        organizer: body.organizer?.trim() || null,
        isRecurring: Boolean(body.isRecurring),
        recurrenceRule: body.recurrenceRule?.trim() || null,
        establishmentId: body.establishmentId || null,
        submittedByUserId: user.id,
        status: 'APPROVED',
        // Event & Promo fields
        eventType: body.eventType && VALID_EVENT_TYPES.includes(body.eventType) ? body.eventType : 'EVENT',
        badge: body.badge && VALID_BADGES.includes(body.badge) ? body.badge : null,
        isPinned: Boolean(body.isPinned),
        targetAudience: body.targetAudience && VALID_AUDIENCES.includes(body.targetAudience) ? body.targetAudience : 'ALL',
        ctaLabel: body.ctaLabel?.trim() || null,
        ctaLink: body.ctaLink?.trim() || null,
        // Régie Pub fields
        isPromotion: Boolean(body.isPromotion),
        priorityScore: Math.min(Math.max(parseInt(body.priorityScore) || 0, 0), 10),
        linkedProductType: body.linkedProductType?.trim() || null,
        linkedProductId: body.linkedProductId?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    logger.error('Error creating event:', error);
    return apiError('Erreur serveur', 500);
  }
}
