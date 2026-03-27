import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { apiError, getErrorMessage } from '@/lib/api-response';

import { logger } from '@/lib/logger';
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// POST /api/contact - Envoyer un message de contact/support
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'write');
  if (!rateLimit.success) {
    return new NextResponse(JSON.stringify({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...getRateLimitHeaders(rateLimit) },
    });
  }

  try {
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!data.csrfToken || !verifyCsrfToken(data.csrfToken)) {
      return apiError('Token CSRF invalide ou manquant', 403);
    }

    const { name, email, subject, message, phone } = data;

    if (!name || !email || !subject || !message) {
      return apiError('Tous les champs sont requis : nom, email, sujet, message');
    }

    // Validation des longueurs
    if (name.length > 100 || email.length > 254 || subject.length > 200 || message.length > 5000) {
      return apiError('Un ou plusieurs champs dépassent la taille maximale autorisée');
    }

    // Validation email basique
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError('Email invalide');
    }

    // Enregistrer dans audit log (pas de modèle ContactMessage, on utilise AuditLog)
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'create',
        entityType: 'contact',
        details: JSON.stringify({ name, email, phone: phone || null, subject, message }),
        ipAddress: (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim(),
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Envoyer un email à l'admin
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL || 'admin@madaspot.com',
          subject: `[Contact] ${escapeHtml(subject)}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px;">
              <h2>Nouveau message de contact</h2>
              <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
              <p><strong>Email :</strong> ${escapeHtml(email)}</p>
              ${phone ? `<p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>` : ''}
              <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
              <hr />
              <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            </div>
          `,
          secret: process.env.EMAIL_SECRET,
        }),
      });
    } catch {
      // Email non bloquant
    }

    return NextResponse.json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error: unknown) {
    logger.error('[CONTACT] Error:', error);
    return apiError(getErrorMessage(error), 500);
  }
}
