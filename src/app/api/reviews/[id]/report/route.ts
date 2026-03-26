import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { verifyCsrfToken } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth/middleware';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
const REPORT_REASONS = [
  'spam',
  'contenu_offensant',
  'faux_avis',
  'hors_sujet',
  'donnees_personnelles',
  'autre',
];

// POST /api/reviews/[id]/report - Report/flag an establishment review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication to report a review
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    // Rate limit: prevent mass-reporting
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(clientId, 'api');
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de signalements. Réessayez plus tard.', retryAfter: rl.resetIn },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Motif requis' }, { status: 400 });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Motif invalide' }, { status: 400 });
    }

    const review = await prisma.establishmentReview.findUnique({ where: { id }, select: { id: true } });
    if (!review) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    // Flag the review for admin moderation
    // Note: isFlagged/flagReason columns may not exist yet in DB, so we unpublish as fallback
    try {
      await prisma.establishmentReview.update({
        where: { id },
        data: { isFlagged: true, flagReason: reason },
      });
    } catch {
      // Fallback: unpublish the review if isFlagged column doesn't exist
      await prisma.establishmentReview.update({
        where: { id },
        data: { isPublished: false },
      });
    }

    return NextResponse.json({ success: true, message: 'Avis signalé avec succès. Notre équipe va le vérifier.' });
  } catch (error) {
    logger.error('Error reporting review:', error);
    return apiError('Erreur serveur', 500);
  }
}
