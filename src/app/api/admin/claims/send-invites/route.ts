import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { sendBrevoEmail } from '@/lib/crm/brevo';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.com';
const MAX_PER_REQUEST = 50; // envoi synchrone : on borne pour rester sous le timeout

function inviteEmail(estName: string, claimUrl: string): { subject: string; html: string } {
  return {
    subject: `${estName} — votre fiche vérifiée vous attend sur Mada Spot (gratuit)`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <div style="padding:24px 0;text-align:center"><img src="${SITE_URL}/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
  <div style="padding:0 24px">
    <p style="font-size:16px;line-height:1.7">Bonjour,</p>
    <p style="font-size:16px;line-height:1.7">Votre établissement <strong>${estName}</strong> est déjà référencé sur <strong>Mada Spot</strong>, la plateforme qui connecte les voyageurs aux professionnels <strong>vérifiés</strong> de Madagascar.</p>
    <p style="font-size:16px;line-height:1.7">Revendiquez votre fiche <strong>gratuitement en 2 minutes</strong> pour :</p>
    <ul style="font-size:15px;line-height:1.9;color:#334155">
      <li>obtenir le badge <strong>« Vérifié »</strong></li>
      <li>apparaître dans les recherches des voyageurs (<strong>haute saison en cours</strong>)</li>
      <li>recevoir des contacts directs (WhatsApp, appel) — <strong>sans commission</strong></li>
    </ul>
    <div style="text-align:center;margin:26px 0"><a href="${claimUrl}" style="display:inline-block;padding:14px 34px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700">Revendiquer ma fiche →</a></div>
    <p style="font-size:14px;line-height:1.7;color:#64748b">Un seul clic : votre compte est créé et vous accédez directement à votre tableau de bord. Vous gardez le contrôle total de votre fiche.</p>
    <p style="font-size:16px;line-height:1.7"><strong>L'équipe Mada Spot</strong></p>
  </div>
  <div style="margin-top:28px;padding:14px 24px;border-top:1px solid #eef2f7"><p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Vous recevez cet email car votre établissement figure dans notre annuaire touristique. Répondez « STOP » pour être retiré, aucune autre sollicitation ne suivra.</p></div>
</div>`,
  };
}

/**
 * POST /api/admin/claims/send-invites
 * Envoie l'invitation "revendiquez votre fiche" par email (Brevo) aux fiches
 * NON revendiquées, AVEC email, PAS ENCORE INVITÉES (idempotent, sans doublon).
 *
 * SÉCURITÉ : aperçu par défaut. Envoi réel seulement si send:true / ?send=1.
 * Lots de 50 max par requête (rappeler jusqu'à totalRemaining = 0).
 * Auth admin OU CRON_SECRET.
 *
 * Body: { filters?: {type,city,limit}, expiresDays?, send?: boolean }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronOk = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
  const admin = cronOk ? true : await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const body = await request.json().catch(() => ({}));
  const { filters, expiresDays } = body as { filters?: { type?: string; city?: string; limit?: number }; expiresDays?: number };
  const sendReal = body?.send === true || new URL(request.url).searchParams.get('send') === '1';

  const VALID_TYPES = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'];
  const limit = Math.min(Math.max(filters?.limit ?? 25, 1), MAX_PER_REQUEST);
  const ttlDays = Math.min(Math.max(expiresDays ?? 30, 1), 90);
  const expiry = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  // Cible : NON revendiquées, AVEC email, et dont l'invitation N'A PAS été
  // réellement ENVOYÉE par email (marqueur reviewedBy='invite-emailed').
  // NB : avoir un token (généré par generate-links pour le CSV) ne compte pas
  // comme "emailé" — on distingue lien généré ≠ email envoyé.
  const where: Record<string, unknown> = {
    isClaimed: false,
    email: { not: null },
    claims: { none: { reviewedBy: 'invite-emailed' } },
  };
  if (filters?.type && VALID_TYPES.includes(filters.type)) where.type = filters.type;
  if (filters?.city) where.city = filters.city;

  const totalRemaining = await prisma.establishment.count({ where });
  const establishments = await prisma.establishment.findMany({
    where,
    select: { id: true, name: true, email: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  // APERÇU (aucun envoi, aucune écriture)
  if (!sendReal) {
    return NextResponse.json({
      ok: true,
      mode: 'PREVIEW',
      totalRemaining,
      nextBatch: establishments.length,
      sample: establishments.slice(0, 15).map((e) => `${e.name} <${e.email}>`),
    });
  }

  // ENVOI RÉEL (lot borné)
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const est of establishments) {
    if (!est.email) continue;

    // Réutiliser le token existant (généré par generate-links) pour garder les
    // liens déjà exportés valides ; sinon en créer un.
    const existing = await prisma.establishmentClaim.findFirst({
      where: { establishmentId: est.id, status: 'PENDING', invitationToken: { not: null }, invitationExpiry: { gte: new Date() } },
      select: { invitationToken: true },
    });
    const token = existing?.invitationToken || randomUUID();
    if (!existing) {
      await prisma.establishmentClaim.create({
        data: {
          establishmentId: est.id,
          claimantName: '',
          claimantEmail: est.email,
          claimantRole: 'owner',
          invitationToken: token,
          invitationExpiry: expiry,
          invitedAt: new Date(),
        },
      });
    }

    const { subject, html } = inviteEmail(est.name, `${SITE_URL}/invite/${token}`);
    const res = await sendBrevoEmail({ to: est.email, subject, html, senderName: 'Mada Spot', senderEmail: 'contact@madaspot.com', tag: 'claim-invite' });
    if (res.ok) {
      sent++;
      // Marque l'invitation comme réellement envoyée (anti-doublon des prochains lots)
      await prisma.establishmentClaim.updateMany({
        where: { establishmentId: est.id, invitationToken: token },
        data: { reviewedBy: 'invite-emailed', invitedAt: new Date() },
      });
    } else {
      failed++;
      errors.push(`${est.email}: ${res.error || res.status}`);
      if (res.status === 401 || res.status === 403) break; // blocage IP Brevo : stop
    }
  }

  await logAudit({
    userId: cronOk ? 'cron' : (admin as { id: string }).id,
    action: 'claim_invites_sent',
    entityType: 'establishment',
    entityId: 'bulk',
    details: { batch: establishments.length, sent, failed },
    ...getRequestMeta(request),
  });
  logger.info(`[CLAIM-INVITES] lot ${establishments.length} → ${sent} envoyés, ${failed} échecs`);

  return NextResponse.json({
    ok: true,
    mode: 'SENT',
    batchSize: establishments.length,
    sent,
    failed,
    totalRemainingBefore: totalRemaining,
    remainingAfter: Math.max(0, totalRemaining - sent),
    errors: errors.slice(0, 10),
  });
}
