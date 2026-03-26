import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getClearSessionCookieConfig } from '@/lib/auth/middleware';
import { verifyPassword } from '@/lib/auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
// DELETE /api/auth/delete-account - Supprimer le compte (RGPD)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(clientId, 'auth');
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: rl.resetIn },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const body = await request.json().catch(() => null);

    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const { password, csrfToken } = body;

    // CSRF verification (mandatory)
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe requis pour confirmer la suppression' },
        { status: 400 }
      );
    }

    // Vérifier le mot de passe
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const isValid = await verifyPassword(password, dbUser.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Audit log avant suppression
    const meta = getRequestMeta(request);
    await logAudit({
      userId: user.id,
      action: 'delete',
      entityType: 'user',
      entityId: user.id,
      details: { email: dbUser.email, reason: 'account_deletion_request' },
      ...meta,
    });

    // Supprimer toutes les sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    // Supprimer l'utilisateur (cascade supprimera les données liées)
    await prisma.user.delete({ where: { id: user.id } });

    // Supprimer le cookie de session
    const response = NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès. Vos données ont été effacées.',
    });

    response.cookies.set(getClearSessionCookieConfig());

    return response;
  } catch (error) {
    logger.error('[DELETE ACCOUNT] Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
