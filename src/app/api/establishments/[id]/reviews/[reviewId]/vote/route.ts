import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logger } from '@/lib/logger';

// POST /api/establishments/[id]/reviews/[reviewId]/vote - Vote on a review
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
    if (body === null || typeof body.isHelpful !== 'boolean') {
      return NextResponse.json({ error: 'isHelpful (boolean) requis' }, { status: 400 });
    }

    const { isHelpful } = body;

    // Check review exists
    const review = await prisma.establishmentReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    // Don't allow voting on own review
    if (review.userId === session.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas voter sur votre propre avis' }, { status: 400 });
    }

    // Upsert vote
    const existing = await prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId: session.id } },
    });

    if (existing) {
      if (existing.isHelpful === isHelpful) {
        // Same vote = toggle off (remove)
        await prisma.reviewVote.delete({ where: { id: existing.id } });
        // Update counts
        await prisma.establishmentReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: { decrement: isHelpful ? 1 : 0 },
            unhelpfulCount: { decrement: isHelpful ? 0 : 1 },
          },
        });
        return NextResponse.json({ vote: null, removed: true });
      } else {
        // Different vote = switch
        await prisma.reviewVote.update({
          where: { id: existing.id },
          data: { isHelpful },
        });
        await prisma.establishmentReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: { increment: isHelpful ? 1 : -1 },
            unhelpfulCount: { increment: isHelpful ? -1 : 1 },
          },
        });
        return NextResponse.json({ vote: { isHelpful }, switched: true });
      }
    } else {
      // New vote
      await prisma.reviewVote.create({
        data: { reviewId, userId: session.id, isHelpful },
      });
      await prisma.establishmentReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: { increment: isHelpful ? 1 : 0 },
          unhelpfulCount: { increment: isHelpful ? 0 : 1 },
        },
      });
      return NextResponse.json({ vote: { isHelpful } });
    }
  } catch (error) {
    logger.error('Error voting on review:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
