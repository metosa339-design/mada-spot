import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { sendClaimNotificationToAdmin } from '@/lib/email';
import { requireAuth } from '@/lib/auth/middleware';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
// POST /api/bons-plans/establishments/[id]/claim - Submit a claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'api');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    const { claimantName, claimantEmail, claimantPhone, claimantRole, proofDescription } = body;

    if (!claimantName || !claimantEmail || !claimantRole) {
      return NextResponse.json(
        { error: 'Nom, email et rôle sont requis' },
        { status: 400 }
      );
    }

    // Check establishment exists
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { id: true, name: true, isClaimed: true },
    });

    if (!establishment) {
      return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 });
    }

    if (establishment.isClaimed) {
      return NextResponse.json(
        { error: 'Cet établissement a déjà été revendiqué' },
        { status: 400 }
      );
    }

    // Check for existing pending claim from same email
    const existingClaim = await prisma.establishmentClaim.findFirst({
      where: {
        establishmentId: id,
        claimantEmail,
        status: 'PENDING',
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Vous avez déjà soumis une revendication pour cet établissement' },
        { status: 400 }
      );
    }

    // Create claim
    const claim = await prisma.establishmentClaim.create({
      data: {
        establishmentId: id,
        claimantName,
        claimantEmail,
        claimantPhone: claimantPhone || null,
        claimantRole,
        proofDescription: proofDescription || null,
      },
    });

    // Notify admin via in-app notification
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'CLAIM_SUBMITTED',
          title: 'Nouvelle revendication de fiche',
          message: `${claimantName} (${claimantRole}) souhaite revendiquer "${establishment.name}"`,
          entityType: 'claim',
          entityId: claim.id,
        },
      });
    }

    // Send email notification (non-blocking)
    sendClaimNotificationToAdmin(establishment.name, claimantName, claimantEmail, claimantRole).catch(() => {});

    return NextResponse.json({ claim, message: 'Revendication soumise avec succès' }, { status: 201 });
  } catch (error) {
    logger.error('Error submitting claim:', error);
    return apiError('Erreur serveur', 500);
  }
}
