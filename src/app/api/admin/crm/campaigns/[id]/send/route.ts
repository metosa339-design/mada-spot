import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { sendBrevoEmail } from '@/lib/crm/brevo';
import { personalize } from '@/lib/crm/segment';
import { logAudit, getRequestMeta } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/admin/crm/campaigns/[id]/send  body: { batch?: number }
// Envoie un lot de destinataires PENDING via Brevo.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* body optionnel */
  }
  const batch = Math.min(Math.max(parseInt(body?.batch, 10) || 40, 1), 100);

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return apiError('Campagne introuvable', 404);
  if (campaign.status === 'DRAFT') return apiError('Calculez d\'abord les destinataires', 400);
  if (campaign.status === 'PAUSED') return apiError('Campagne en pause', 409);

  const pending = await prisma.campaignRecipient.findMany({
    where: { campaignId: id, status: 'PENDING' },
    take: batch,
  });

  if (pending.length === 0) {
    await prisma.campaign.update({ where: { id }, data: { status: 'DONE' } });
    return apiSuccess({ done: true, sent: 0, failed: 0, remaining: 0 });
  }

  if (campaign.status !== 'SENDING') {
    await prisma.campaign.update({ where: { id }, data: { status: 'SENDING', sentAt: campaign.sentAt || new Date() } });
  }

  let sent = 0;
  let failed = 0;
  let ipBlocked = false;

  for (const r of pending) {
    const rec = {
      email: r.email,
      phone: null,
      firstName: r.firstName,
      establishmentName: r.establishmentName,
      city: r.city,
      typeLabel: r.typeLabel,
    };
    const subject = personalize(campaign.subject, rec);
    const html = personalize(campaign.htmlBody, rec);

    const result = await sendBrevoEmail({
      to: r.email,
      subject,
      html,
      senderName: 'Metosaela RANDRIAMAZAORO — Mada Spot',
      senderEmail: 'contact@madaspot.com',
      tag: `campaign-${id}`,
    });

    if (result.ok) {
      await prisma.campaignRecipient.update({
        where: { id: r.id },
        data: { status: 'SENT', sentAt: new Date(), error: null },
      });
      sent++;
    } else {
      await prisma.campaignRecipient.update({
        where: { id: r.id },
        data: { status: 'FAILED', error: (result.error || 'Erreur').slice(0, 200) },
      });
      failed++;
      if (result.ipBlocked) {
        ipBlocked = true;
        break; // stop net : l'IP Brevo est bloquée
      }
    }
  }

  const [remaining, aggr] = await Promise.all([
    prisma.campaignRecipient.count({ where: { campaignId: id, status: 'PENDING' } }),
    prisma.campaignRecipient.groupBy({ by: ['status'], where: { campaignId: id }, _count: { _all: true } }),
  ]);
  const totalSent = aggr.find((a) => a.status === 'SENT')?._count._all || 0;
  const totalFailed = aggr.find((a) => a.status === 'FAILED')?._count._all || 0;

  await prisma.campaign.update({
    where: { id },
    data: {
      sentCount: totalSent,
      failedCount: totalFailed,
      status: remaining === 0 ? 'DONE' : 'SENDING',
    },
  });

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'send_batch',
    entityType: 'campaign',
    entityId: id,
    details: { sent, failed, remaining },
    ...meta,
  }).catch(() => {});

  return apiSuccess({
    sent,
    failed,
    remaining,
    done: remaining === 0,
    ipBlocked,
    error: ipBlocked ? 'IP Brevo non autorisée — autorisez-la dans Brevo > Sécurité, puis relancez.' : undefined,
  });
}
