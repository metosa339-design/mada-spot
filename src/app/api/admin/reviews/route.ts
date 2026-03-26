import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';


import { logger } from '@/lib/logger';
// GET /api/admin/reviews - List all establishment reviews
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all'; // 'all', 'published', 'hidden'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

  try {
    const where: any = {};
    if (status === 'published') where.isPublished = true;
    if (status === 'hidden') where.isPublished = false;
    if (status === 'flagged') where.isFlagged = true;

    const [reviews, total] = await Promise.all([
      prisma.establishmentReview.findMany({
        where,
        select: {
          id: true, establishmentId: true, authorName: true, authorEmail: true, userId: true,
          rating: true, title: true, comment: true, images: true, isVerified: true, isPublished: true,
          isFlagged: true, flagReason: true,
          ownerResponse: true, respondedAt: true, createdAt: true,
          establishment: { select: { name: true, type: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.establishmentReview.count({ where }),
    ]);

    const [estTotal, estHidden] = await Promise.all([
      prisma.establishmentReview.count(),
      prisma.establishmentReview.count({ where: { isPublished: false } }),
    ]);

    return NextResponse.json({
      establishmentReviews: reviews,
      establishmentReviewsTotal: total,
      stats: {
        estTotal,
        estHidden,
      },
    });
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/admin/reviews - Moderate a review (publish/unpublish/delete)
export async function PUT(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  try {
    const _body = await request.json().catch(() => null);
    if (_body === null) return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    const { reviewId, action } = _body;
    // action: 'publish' | 'unpublish' | 'delete'

    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (action === 'delete') {
      await prisma.establishmentReview.delete({ where: { id: reviewId } });
    } else if (action === 'publish') {
      await prisma.establishmentReview.update({ where: { id: reviewId }, data: { isPublished: true } });
    } else if (action === 'unpublish') {
      await prisma.establishmentReview.update({ where: { id: reviewId }, data: { isPublished: false } });
    } else if (action === 'dismiss_flag') {
      await prisma.establishmentReview.update({ where: { id: reviewId }, data: { isFlagged: false, flagReason: null } });
    }

    // Audit log
    const meta = getRequestMeta(request);
    logAudit({ userId: user.id, action, entityType: 'review', entityId: reviewId, details: { reviewType: 'establishment', action }, ...meta });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error moderating review:', error);
    return apiError('Erreur serveur', 500);
  }
}
