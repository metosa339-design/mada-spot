
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';
// PUT /api/establishments/[id]/reviews/[reviewId] - Owner responds to a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;

    const csrf = request.headers.get('x-csrf-token');
    if (!csrf || !verifyCsrfToken(csrf)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide' }, { status: 403 });
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session invalide' }, { status: 401 });

    // Verify ownership
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { isClaimed: true, claimedByUserId: true },
    });

    if (!establishment || !establishment.isClaimed || establishment.claimedByUserId !== session.id) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 403 });
    }

    const data = await request.json().catch(() => null);


    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    if (!data.ownerResponse) {
      return NextResponse.json({ success: false, error: 'Réponse requise' }, { status: 400 });
    }

    await prisma.establishmentReview.update({
      where: { id: reviewId },
      data: {
        ownerResponse: data.ownerResponse,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error responding to review:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
