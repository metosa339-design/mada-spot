import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';


import { logger } from '@/lib/logger';
// GET /api/admin/claims - List claim requests
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const { searchParams } = new URL(request.url);
    const VALID_CLAIM_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
    const statusParam = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {};
    if (statusParam && VALID_CLAIM_STATUSES.includes(statusParam)) where.status = statusParam;

    const [claims, total, pendingCount] = await Promise.all([
      prisma.establishmentClaim.findMany({
        where,
        include: {
          establishment: {
            select: { id: true, name: true, type: true, city: true, coverImage: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.establishmentClaim.count({ where }),
      prisma.establishmentClaim.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({ claims, total, pendingCount });
  } catch (error) {
    logger.error('Error fetching claims:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/admin/claims - Approve or reject a claim
export async function PUT(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const { claimId, action, rejectionReason } = body;

    if (!claimId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'claimId et action (approve/reject) requis' },
        { status: 400 }
      );
    }

    const claim = await prisma.establishmentClaim.findUnique({
      where: { id: claimId },
      include: { establishment: { select: { id: true, name: true } } },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Revendication non trouvée' }, { status: 404 });
    }

    if (claim.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cette revendication a déjà été traitée' }, { status: 400 });
    }

    if (action === 'approve') {
      // Lookup the claimant user by email so we can set claimedByUserId
      const claimantUser = claim.claimantEmail
        ? await prisma.user.findUnique({ where: { email: claim.claimantEmail }, select: { id: true } })
        : null;

      // Update claim status
      await prisma.establishmentClaim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      // Mark establishment as claimed
      await prisma.establishment.update({
        where: { id: claim.establishmentId },
        data: {
          isClaimed: true,
          claimedAt: new Date(),
          ...(claimantUser ? { claimedByUserId: claimantUser.id } : {}),
        },
      });

      // Reject other pending claims for the same establishment
      await prisma.establishmentClaim.updateMany({
        where: {
          establishmentId: claim.establishmentId,
          id: { not: claimId },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Une autre revendication a été approuvée pour cet établissement',
          reviewedAt: new Date(),
        },
      });
    } else {
      // Reject claim
      await prisma.establishmentClaim.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Revendication refusée par l\'administrateur',
          reviewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Revendication approuvée' : 'Revendication refusée',
    });
  } catch (error) {
    logger.error('Error processing claim:', error);
    return apiError('Erreur serveur', 500);
  }
}
