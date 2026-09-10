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

/**
 * Relance d'invitation : le destinataire a DEJA recu un premier message dont le
 * lien a expire. Le texte le dit franchement plutot que de faire comme si
 * c'etait un premier contact — c'est plus honnete et ca explique le second mail.
 */
function relanceInviteEmail(estName: string, claimUrl: string): { subject: string; html: string } {
  return {
    subject: `${estName} — votre lien de revendication a expiré, en voici un nouveau`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <div style="padding:24px 0;text-align:center"><img src="${SITE_URL}/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
  <div style="padding:0 24px">
    <p style="font-size:16px;line-height:1.7">Bonjour,</p>
    <p style="font-size:16px;line-height:1.7">Nous vous avions écrit cet été au sujet de la fiche de <strong>${estName}</strong> sur <strong>Mada Spot</strong>. Le lien que contenait ce message a expiré depuis, et c'est de notre côté que ça s'est joué : personne ne vous a relancé à temps.</p>
    <p style="font-size:16px;line-height:1.7">Voici un nouveau lien, valable un mois. Revendiquer votre fiche prend <strong>deux minutes</strong> et reste <strong>gratuit</strong> :</p>
    <ul style="font-size:15px;line-height:1.9;color:#334155">
      <li>vous obtenez le badge <strong>« Vérifié »</strong></li>
      <li>vous apparaissez dans les recherches des voyageurs</li>
      <li>vous recevez les contacts en direct (WhatsApp, appel) — <strong>sans commission</strong></li>
    </ul>
    <div style="text-align:center;margin:26px 0"><a href="${claimUrl}" style="display:inline-block;padding:14px 34px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700">Revendiquer ma fiche →</a></div>
    <p style="font-size:14px;line-height:1.7;color:#64748b">Un seul clic suffit : votre compte est créé et vous arrivez directement sur votre tableau de bord. Vous gardez le contrôle total de votre fiche, et vous pouvez la retirer quand vous voulez.</p>
    <p style="font-size:16px;line-height:1.7"><strong>L'équipe Mada Spot</strong></p>
  </div>
  <div style="margin-top:28px;padding:14px 24px;border-top:1px solid #eef2f7"><p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Vous recevez cet email car votre établissement figure dans notre annuaire touristique. Répondez « STOP » pour être retiré, aucune autre sollicitation ne suivra.</p></div>
</div>`,
  };
}

/**
 * Adresses que Brevo refuse deja de servir (rebonds, desinscriptions, plaintes).
 * Les reinclure ne ferait que gonfler le compteur "blocked" sans rien delivrer,
 * et degrade la reputation d'expedition. En cas d'echec de l'appel on renvoie
 * null : mieux vaut envoyer sans le filtre que de bloquer toute la relance.
 */
async function fetchBrevoBlocked(): Promise<Set<string> | null> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  const blocked = new Set<string>();
  try {
    for (let offset = 0; offset < 2000; offset += 500) {
      const res = await fetch(
        `https://api.brevo.com/v3/smtp/blockedContacts?limit=500&offset=${offset}`,
        { headers: { accept: 'application/json', 'api-key': apiKey } }
      );
      if (!res.ok) return blocked.size ? blocked : null;
      const data = (await res.json()) as { contacts?: Array<{ email?: string }> };
      const page = data.contacts || [];
      page.forEach((c) => c.email && blocked.add(c.email.toLowerCase()));
      if (page.length < 500) break;
    }
    return blocked;
  } catch {
    return blocked.size ? blocked : null;
  }
}

/**
 * POST /api/admin/claims/renew-invites
 *
 * Renouvelle les invitations "revendiquez votre fiche" dont le jeton a EXPIRE,
 * et relance par email. Complete /send-invites, qui cible a l'inverse les fiches
 * jamais contactees (marqueur reviewedBy='invite-emailed') et exclut donc, par
 * construction, celles-ci.
 *
 * Contexte : les 295 invitations parties les 22-23/07/2026 avaient un jeton de
 * 30 jours, mort le 21/08 sans qu'aucune relance ne soit envoyee. 276 sont
 * restees PENDING avec un lien qui ne menait plus a rien.
 *
 * SECURITE : apercu par defaut. Envoi reel seulement si send:true / ?send=1.
 * Lots de 50 max (rappeler jusqu'a totalRemaining = 0).
 *
 * IDEMPOTENCE : la cible exige un jeton expire. Un jeton renouvelle sort donc
 * de lui-meme du lot suivant, sans marqueur supplementaire. Le jeton n'est
 * ecrit qu'APRES un envoi reussi : si Brevo echoue, la ligne reste a reprendre.
 *
 * Body: { limit?, expiresDays?, send?, skipBlocked? }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronOk = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
  const admin = cronOk ? true : await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const body = await request.json().catch(() => ({}));
  const { limit: rawLimit, expiresDays, skipBlocked } = body as {
    limit?: number;
    expiresDays?: number;
    skipBlocked?: boolean;
  };
  const sendReal = body?.send === true || new URL(request.url).searchParams.get('send') === '1';
  const limit = Math.min(Math.max(rawLimit ?? 25, 1), MAX_PER_REQUEST);
  const ttlDays = Math.min(Math.max(expiresDays ?? 30, 1), 90);
  const filtrerBloquees = skipBlocked !== false;

  const now = new Date();

  // Cible : invitation deja envoyee, jeton expire, fiche toujours a prendre.
  const where = {
    status: 'PENDING' as const,
    reviewedBy: 'invite-emailed',
    invitationExpiry: { lt: now },
    claimantEmail: { not: '' },
    establishment: { isClaimed: false },
  };

  const totalRemaining = await prisma.establishmentClaim.count({ where });

  // On prend large : le dedoublonnage par adresse peut retirer des lignes, et on
  // veut quand meme remplir le lot.
  const candidats = await prisma.establishmentClaim.findMany({
    where,
    select: {
      id: true,
      claimantEmail: true,
      establishmentId: true,
      establishment: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 3,
  });

  const bloquees = filtrerBloquees ? await fetchBrevoBlocked() : null;

  // Une seule sollicitation par adresse, meme si elle porte plusieurs fiches.
  const vues = new Set<string>();
  const lot: typeof candidats = [];
  let ignoreesBloquees = 0;
  let ignoreesDoublon = 0;

  for (const c of candidats) {
    if (lot.length >= limit) break;
    const mail = c.claimantEmail.trim().toLowerCase();
    if (!mail || !mail.includes('@')) continue;
    if (vues.has(mail)) {
      ignoreesDoublon++;
      continue;
    }
    if (bloquees?.has(mail)) {
      ignoreesBloquees++;
      continue;
    }
    vues.add(mail);
    lot.push(c);
  }

  if (!sendReal) {
    return NextResponse.json({
      ok: true,
      mode: 'PREVIEW',
      totalRemaining,
      nextBatch: lot.length,
      ttlDays,
      blocklistBrevo: bloquees ? bloquees.size : 'indisponible',
      ignoreesBloquees,
      ignoreesDoublon,
      sample: lot.slice(0, 15).map((c) => `${c.establishment?.name ?? '?'} <${c.claimantEmail}>`),
      apercuSujet: relanceInviteEmail(lot[0]?.establishment?.name ?? 'Votre établissement', '…').subject,
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const expiry = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  for (const c of lot) {
    const token = randomUUID();
    const { subject, html } = relanceInviteEmail(
      c.establishment?.name ?? 'Votre établissement',
      `${SITE_URL}/invite/${token}`
    );

    const res = await sendBrevoEmail({
      to: c.claimantEmail,
      subject,
      html,
      senderName: 'Mada Spot',
      senderEmail: 'contact@madaspot.com',
      tag: 'claim-relance',
    });

    if (!res.ok) {
      failed++;
      errors.push(`${c.claimantEmail}: ${res.error || res.status}`);
      // Blocage IP Brevo ou cle refusee : inutile d'insister sur tout le lot.
      if (res.status === 401 || res.status === 403 || res.ipBlocked) break;
      continue;
    }

    // Le jeton n'est persiste qu'ici : un envoi rate laisse la ligne expiree,
    // donc reprise au prochain lot.
    await prisma.establishmentClaim.update({
      where: { id: c.id },
      data: { invitationToken: token, invitationExpiry: expiry, invitedAt: new Date() },
    });
    sent++;
  }

  await logAudit({
    userId: cronOk ? 'cron' : (admin as { id: string }).id,
    action: 'claim_invites_renewed',
    entityType: 'establishment',
    entityId: 'bulk',
    details: { batch: lot.length, sent, failed, ttlDays, ignoreesBloquees },
    ...getRequestMeta(request),
  });
  logger.info(`[CLAIM-RENEW] lot ${lot.length} → ${sent} envoyés, ${failed} échecs`);

  return NextResponse.json({
    ok: true,
    mode: 'SENT',
    batchSize: lot.length,
    sent,
    failed,
    ignoreesBloquees,
    totalRemainingBefore: totalRemaining,
    remainingAfter: Math.max(0, totalRemaining - sent),
    errors: errors.slice(0, 10),
  });
}
