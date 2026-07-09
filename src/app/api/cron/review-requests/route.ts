import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { sendBrevoEmail } from '@/lib/crm/brevo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const SITE = 'https://madaspot.com';

function reviewEmail(firstName: string | null, estName: string, estId: string): { subject: string; html: string } {
  const hi = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const link = `${SITE}/bons-plans/avis/${estId}`;
  return {
    subject: `Comment s'est passé votre passage à ${estName} ?`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <div style="padding:24px 0;text-align:center"><img src="${SITE}/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
  <div style="padding:0 24px">
    <p style="font-size:16px;line-height:1.7">${hi}</p>
    <p style="font-size:16px;line-height:1.7">Vous êtes récemment passé(e) chez <strong>${estName}</strong>. Comment ça s'est passé ? Votre avis aide les autres voyageurs et l'établissement.</p>
    <p style="font-size:16px;line-height:1.7;text-align:center;margin:20px 0">Donnez votre note en 30 secondes :</p>
    <div style="text-align:center;margin:10px 0 22px"><a href="${link}" style="font-size:26px;text-decoration:none;letter-spacing:6px">⭐⭐⭐⭐⭐</a></div>
    <div style="text-align:center;margin:0 0 26px"><a href="${link}" style="display:inline-block;padding:14px 32px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700">Laisser mon avis →</a></div>
    <p style="font-size:16px;line-height:1.7">Merci !<br><strong>L'équipe Mada Spot</strong></p>
  </div>
  <div style="margin-top:28px;padding:14px 24px;border-top:1px solid #eef2f7"><p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Répondez STOP pour ne plus recevoir ces messages.</p></div>
</div>`,
  };
}

// POST /api/cron/review-requests — envoie les demandes d'avis 2-3 j après le passage.
// Auth : CRON_SECRET (cron) OU session admin (bouton manuel).
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronOk = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
  const admin = cronOk ? true : await checkAdminAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = Date.now();
  const since = new Date(now - 10 * 86400000); // fenêtre de sécurité : 10 derniers jours

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['confirmed', 'completed'] },
      reviewRequestedAt: null,
      checkIn: { gte: since },
    },
    select: {
      id: true, checkIn: true, checkOut: true, establishmentId: true,
      user: { select: { email: true, firstName: true } },
      establishment: { select: { id: true, name: true } },
    },
    take: 300,
  });

  let sent = 0;
  let skipped = 0;
  for (const b of bookings) {
    const visitDate = (b.checkOut || b.checkIn).getTime();
    const daysAgo = (now - visitDate) / 86400000;
    // On demande entre 2 et 4 jours après le passage
    if (daysAgo < 2 || daysAgo > 4) { skipped++; continue; }
    const email = b.user?.email;
    if (!email || !b.establishment) { skipped++; continue; }

    // Déjà noté ? on ne redemande pas
    const already = await prisma.establishmentReview.findFirst({ where: { bookingId: b.id }, select: { id: true } }).catch(() => null);
    if (already) { await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestedAt: new Date() } }); skipped++; continue; }

    const { subject, html } = reviewEmail(b.user?.firstName || null, b.establishment.name, b.establishment.id);
    const res = await sendBrevoEmail({ to: email, subject, html, senderName: 'Mada Spot', senderEmail: 'contact@madaspot.com', tag: 'demande-avis' });
    if (res.ok) {
      await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestedAt: new Date() } });
      sent++;
      if (res.ipBlocked) break;
    } else {
      skipped++;
      if (res.ipBlocked) break;
    }
  }

  return NextResponse.json({ success: true, sent, skipped, scanned: bookings.length });
}
