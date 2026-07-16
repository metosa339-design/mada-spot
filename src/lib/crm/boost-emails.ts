// E-mails liés aux Boosts (mises en avant payantes Mobile Money).
// Email 1 : confirmation d'activation (déclenché à la création du boost).
// Email 2 : relance J-1 avant expiration (déclenché par le cron quotidien).

import { prisma } from '@/lib/db';
import { sendBrevoEmail } from '@/lib/crm/brevo';

const SITE_URL = 'https://madaspot.com';
const FB_URL = 'https://www.facebook.com/madaspot';

const PAYMENT_LABELS: Record<string, string> = {
  mvola: 'MVola',
  orange_money: 'Orange Money',
  airtel_money: 'Airtel Money',
  especes: 'espèces',
};

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (24 * 60 * 60 * 1000)));
}

/**
 * Résout l'e-mail du propriétaire d'une fiche : compte revendiquant en priorité,
 * sinon e-mail de contact de la fiche. Renvoie null si aucune adresse.
 */
export async function resolveOwnerEmail(establishmentId: string): Promise<{ email: string | null; name: string }> {
  const est = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: { name: true, email: true, claimedByUserId: true },
  });
  if (!est) return { email: null, name: '' };
  let email = (est.email || '').trim() || null;
  if (est.claimedByUserId) {
    const user = await prisma.user.findUnique({ where: { id: est.claimedByUserId }, select: { email: true } }).catch(() => null);
    if (user?.email) email = user.email; // le compte propriétaire prime
  }
  return { email, name: est.name };
}

function shell(inner: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="${SITE_URL}/logo.png" alt="Mada Spot" width="48" height="48" style="border-radius:12px"></div>
<div style="padding:0 24px">${inner}
  <p style="font-size:16px;line-height:1.7;margin:22px 0 4px">Bien à vous,</p>
  <p style="font-size:16px;margin:0 0 2px"><strong>L'équipe Mada Spot</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0"><a href="${SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div></div>`;
}

/** EMAIL 1 — Confirmation d'activation du boost (immédiat). */
export async function sendBoostActivationEmail(boost: {
  establishmentId: string;
  establishmentName?: string | null;
  startDate: Date;
  endDate: Date;
  paymentMethod?: string | null;
  price?: number | null;
}): Promise<{ sent: boolean; reason?: string }> {
  const { email, name } = await resolveOwnerEmail(boost.establishmentId);
  const display = boost.establishmentName || name || 'votre établissement';
  if (!email) return { sent: false, reason: 'no_email' };

  const days = daysBetween(boost.startDate, boost.endDate);
  const pay = boost.paymentMethod ? PAYMENT_LABELS[boost.paymentMethod] || boost.paymentMethod : null;
  const inner = `
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Bonne nouvelle ! Nous avons bien reçu votre paiement${pay ? ` par <strong>${pay}</strong>` : ''} et
    <strong>votre mise en avant est activée</strong> sur Mada Spot 🚀
  </p>
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:0 0 16px">
    <p style="font-size:15px;line-height:1.7;margin:0"><strong>${display}</strong></p>
    <p style="font-size:15px;line-height:1.7;margin:6px 0 0">
      Période : <strong>du ${fmtDate(boost.startDate)} au ${fmtDate(boost.endDate)}</strong> (${days} jour${days > 1 ? 's' : ''})
    </p>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Pendant toute cette période, votre fiche apparaît <strong>en avant</strong> auprès des voyageurs.
    C'est le moment idéal pour vérifier que vos photos et informations sont à jour.
  </p>`;
  const r = await sendBrevoEmail({
    to: email,
    subject: `🚀 Votre boost est activé sur MadaSpot !`,
    html: shell(inner),
    tag: 'boost-activation',
  });
  return { sent: r.ok, reason: r.ok ? undefined : r.error };
}

/** EMAIL 2 — Relance J-1 avant expiration (cron quotidien). */
export async function sendBoostExpiryReminders(): Promise<{ scanned: number; sent: number; skipped: number }> {
  const now = new Date();
  // Fenêtre = demain (00:00 → 23:59:59) en heure serveur.
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const boosts = await prisma.boost.findMany({
    where: { status: 'ACTIVE', endDate: { gte: start, lte: end }, expiryReminderSentAt: null },
    select: { id: true, establishmentId: true, establishmentName: true, endDate: true },
  });

  let sent = 0, skipped = 0;
  for (const b of boosts) {
    const { email, name } = await resolveOwnerEmail(b.establishmentId);
    const display = b.establishmentName || name || 'votre établissement';
    if (!email) { skipped++; continue; }
    const inner = `
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Petit rappel amical : la mise en avant de <strong>${display}</strong> sur Mada Spot
    <strong>prend fin demain (${fmtDate(b.endDate)})</strong>.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Pour <strong>prolonger votre visibilité</strong> sans interruption, rien de plus simple :
    effectuez votre paiement Mobile Money (MVola, Orange Money ou Airtel Money) et
    <strong>renvoyez-nous la preuve de paiement</strong> sur notre page Facebook.
  </p>
  <div style="text-align:center;margin:24px 0">
    <a href="${FB_URL}" style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Renouveler via Facebook →</a>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Sans renouvellement, votre fiche restera bien en ligne — elle ne sera simplement plus mise en avant.
  </p>`;
    const r = await sendBrevoEmail({
      to: email,
      subject: `⏳ Votre mise en avant MadaSpot prend fin demain`,
      html: shell(inner),
      tag: 'boost-expiry-reminder',
    });
    if (r.ok) {
      await prisma.boost.update({ where: { id: b.id }, data: { expiryReminderSentAt: new Date() } }).catch(() => {});
      sent++;
    } else {
      skipped++;
    }
  }
  return { scanned: boosts.length, sent, skipped };
}
