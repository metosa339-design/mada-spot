import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logger } from '@/lib/logger';

// POST /api/establishments/[id]/reviews/[reviewId]/report - Report a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { reviewId } = await params;

  // Require authentication
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (body === null || !body.reason || typeof body.reason !== 'string') {
      return NextResponse.json({ error: 'Raison du signalement requise' }, { status: 400 });
    }

    const { reason } = body;

    if (reason.length < 3 || reason.length > 500) {
      return NextResponse.json({ error: 'La raison doit contenir entre 3 et 500 caractères' }, { status: 400 });
    }

    // Check review exists
    const review = await prisma.establishmentReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    // Already flagged
    if (review.isFlagged) {
      return NextResponse.json({ error: 'Cet avis a déjà été signalé' }, { status: 400 });
    }

    // Flag the review
    await prisma.establishmentReview.update({
      where: { id: reviewId },
      data: {
        isFlagged: true,
        flagReason: reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error reporting review:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
