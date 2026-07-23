import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { sendBrevoEmail } from '@/lib/crm/brevo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const SITE = 'https://madaspot.com';

function digestEmail(firstName: string | null, estName: string, views: number, contacts: number): { subject: string; html: string } {
  const hi = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const link = `${SITE}/dashboard/statistiques`;
  const editLink = `${SITE}/dashboard/etablissement`;
  return {
    subject: `${estName} : ${views} vue${views > 1 ? 's' : ''} cette semaine sur Mada Spot`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <div style="padding:24px 0;text-align:center"><img src="${SITE}/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
  <div style="padding:0 24px">
    <p style="font-size:16px;line-height:1.7">${hi}</p>
    <p style="font-size:16px;line-height:1.7">Voici l'activité de votre fiche <strong>${estName}</strong> cette semaine :</p>
    <div style="display:flex;gap:12px;margin:18px 0">
      <div style="flex:1;text-align:center;background:#fff7ed;border:1px solid #ffedd5;border-radius:12px;padding:16px">
        <div style="font-size:30px;font-weight:800;color:#ff6b35">${views}</div>
        <div style="font-size:13px;color:#64748b">vues</div>
      </div>
      <div style="flex:1;text-align:center;background:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;padding:16px">
        <div style="font-size:30px;font-weight:800;color:#16a34a">${contacts}</div>
        <div style="font-size:13px;color:#64748b">contacts (WhatsApp / appel / email)</div>
      </div>
    </div>
    <p style="font-size:15px;line-height:1.7;color:#475569">Des voyageurs vous cherchent en ce moment. Une fiche avec de belles photos et des infos complètes convertit bien plus de vues en contacts.</p>
    <div style="text-align:center;margin:22px 0"><a href="${link}" style="display:inline-block;padding:14px 32px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700">Voir mes statistiques →</a></div>
    <p style="font-size:14px;line-height:1.7;text-align:center"><a href="${editLink}" style="color:#ff6b35">Compléter ma fiche (photos, tarifs…)</a></p>
    <p style="font-size:16px;line-height:1.7"><strong>L'équipe Mada Spot</strong></p>
  </div>
  <div style="margin-top:28px;padding:14px 24px;border-top:1px solid #eef2f7"><p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Vous recevez cet email car votre établissement est référencé sur Mada Spot. Répondez STOP pour ne plus recevoir ces récapitulatifs.</p></div>
</div>`,
  };
}

// POST /api/cron/provider-digest — récap hebdo (vues + contacts) aux propriétaires
// de fiches revendiquées ayant eu de l'activité sur 7 jours.
// Auth : CRON_SECRET (cron) OU session admin (déclenchement manuel).
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronOk = !process.env.CRON_SECRET || secret === process.env.CRON_SECRET;
  const admin = cronOk ? true : await checkAdminAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dry = new URL(request.url).searchParams.get('dry') === '1';
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const MAX_SEND = 300;

  // Agrégation activité 7 j
  const [viewsGrouped, clicksGrouped] = await Promise.all([
    prisma.establishmentView.groupBy({
      by: ['establishmentId'],
      where: { createdAt: { gte: weekAgo } },
      _count: { _all: true },
    }),
    prisma.outboundClick.groupBy({
      by: ['establishmentId'],
      where: { createdAt: { gte: weekAgo } },
      _count: { _all: true },
    }),
  ]);

  const viewsBy = new Map(viewsGrouped.map((v) => [v.establishmentId, v._count._all]));
  const clicksBy = new Map(clicksGrouped.map((c) => [c.establishmentId, c._count._all]));

  // Fiches concernées : celles avec de l'activité cette semaine, revendiquées, avec propriétaire email
  const activeIds = Array.from(new Set([...viewsBy.keys(), ...clicksBy.keys()]));
  if (activeIds.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0, sent: 0, note: 'Aucune activité cette semaine' });
  }

  const establishments = await prisma.establishment.findMany({
    where: { id: { in: activeIds }, isClaimed: true, claimedByUserId: { not: null } },
    select: { id: true, name: true, claimedByUserId: true },
  });

  // Propriétaires (pas de relation directe : on résout via claimedByUserId)
  const ownerIds = Array.from(new Set(establishments.map((e) => e.claimedByUserId).filter((x): x is string => !!x)));
  const owners = ownerIds.length
    ? await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, email: true, firstName: true } })
    : [];
  const ownerById = new Map(owners.map((u) => [u.id, u]));

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const est of establishments) {
    if (sent >= MAX_SEND) break;
    const owner = est.claimedByUserId ? ownerById.get(est.claimedByUserId) : null;
    const email = owner?.email;
    if (!email) { skipped++; continue; }
    const views = viewsBy.get(est.id) || 0;
    const contacts = clicksBy.get(est.id) || 0;
    if (views === 0 && contacts === 0) { skipped++; continue; }

    if (dry) { sent++; continue; }

    const { subject, html } = digestEmail(owner?.firstName || null, est.name, views, contacts);
    const res = await sendBrevoEmail({ to: email, subject, html, senderName: 'Mada Spot', senderEmail: 'contact@madaspot.com', tag: 'digest-hebdo' });
    if (res.ok) sent++;
    else { errors.push(`${email}: ${res.error || res.status}`); if (res.status === 401 || res.status === 403) break; }
  }

  return NextResponse.json({
    ok: true,
    dry,
    candidatesWithActivity: activeIds.length,
    claimedWithOwner: establishments.length,
    sent,
    skipped,
    errors: errors.slice(0, 10),
  });
}
