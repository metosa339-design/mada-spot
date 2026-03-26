import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { logger } from '@/lib/logger';

const VALID_CATEGORIES = ['FESTIVAL', 'CULTURAL', 'SPORT', 'NATURE', 'MARKET', 'OTHER'];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const VALID_EVENT_TYPES = ['EVENT', 'PROMOTION', 'ADVERTISEMENT'];
const VALID_BADGES = ['NOUVEAU', 'PROMO', 'EXCLUSIF', 'OFFICIEL'];
const VALID_AUDIENCES = ['ALL', 'TRAVELERS', 'PROVIDERS'];

// PUT /api/admin/events/[id] - Update event (approve/reject/edit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Corps de requête JSON invalide', 400);
    }

    // Check if event exists
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return apiError('Événement non trouvé', 404);
    }

    const updateData: Record<string, unknown> = {};

    // Status update
    if (body.status && VALID_STATUSES.includes(body.status)) {
      updateData.status = body.status;
    }

    // Editable fields
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.startDate !== undefined) {
      const d = new Date(body.startDate);
      if (!isNaN(d.getTime())) updateData.startDate = d;
    }
    if (body.endDate !== undefined) {
      if (body.endDate === null) {
        updateData.endDate = null;
      } else {
        const d = new Date(body.endDate);
        if (!isNaN(d.getTime())) updateData.endDate = d;
      }
    }
    if (body.location !== undefined) updateData.location = body.location?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.region !== undefined) updateData.region = body.region?.trim() || null;
    if (body.category !== undefined && VALID_CATEGORIES.includes(body.category)) {
      updateData.category = body.category;
    }
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage?.trim() || null;
    if (body.organizer !== undefined) updateData.organizer = body.organizer?.trim() || null;
    if (body.isRecurring !== undefined) updateData.isRecurring = Boolean(body.isRecurring);
    if (body.recurrenceRule !== undefined) updateData.recurrenceRule = body.recurrenceRule?.trim() || null;
    if (body.establishmentId !== undefined) updateData.establishmentId = body.establishmentId || null;

    // Event & Promo fields
    if (body.eventType !== undefined && VALID_EVENT_TYPES.includes(body.eventType)) {
      updateData.eventType = body.eventType;
    }
    if (body.badge !== undefined) {
      updateData.badge = body.badge && VALID_BADGES.includes(body.badge) ? body.badge : null;
    }
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
    if (body.targetAudience !== undefined && VALID_AUDIENCES.includes(body.targetAudience)) {
      updateData.targetAudience = body.targetAudience;
    }
    if (body.ctaLabel !== undefined) updateData.ctaLabel = body.ctaLabel?.trim() || null;
    if (body.ctaLink !== undefined) updateData.ctaLink = body.ctaLink?.trim() || null;

    // Régie Pub fields
    if (body.isPromotion !== undefined) updateData.isPromotion = Boolean(body.isPromotion);
    if (body.priorityScore !== undefined) updateData.priorityScore = Math.min(Math.max(parseInt(body.priorityScore) || 0, 0), 10);
    if (body.linkedProductType !== undefined) updateData.linkedProductType = body.linkedProductType?.trim() || null;
    if (body.linkedProductId !== undefined) updateData.linkedProductId = body.linkedProductId?.trim() || null;

    const event = await prisma.event.update({
      where: { id },
      data: updateData as any,
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    logger.error('Error updating event:', error);
    return apiError('Erreur serveur', 500);
  }
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  try {
    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return apiError('Événement non trouvé', 404);
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting event:', error);
    return apiError('Erreur serveur', 500);
  }
}
