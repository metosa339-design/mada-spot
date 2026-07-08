import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { resolveSegment, SegmentFilter } from '@/lib/crm/segment';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/admin/crm/campaigns/[id]/recipients
// (Re)calcule les destinataires depuis le segment de la campagne et passe en READY.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return apiError('Campagne introuvable', 404);
  if (campaign.status === 'SENDING') return apiError('Envoi en cours, impossible de recalculer', 409);

  let filter: SegmentFilter;
  try {
    filter = JSON.parse(campaign.segment);
  } catch {
    return apiError('Segment invalide', 400);
  }

  const recipients = await resolveSegment(filter);

  // Remise à zéro puis insertion
  await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } });
  if (recipients.length > 0) {
    await prisma.campaignRecipient.createMany({
      data: recipients.map((r) => ({
        campaignId: id,
        email: r.email,
        firstName: r.firstName,
        establishmentName: r.establishmentName,
        city: r.city,
        typeLabel: r.typeLabel,
      })),
      skipDuplicates: true,
    });
  }

  const total = await prisma.campaignRecipient.count({ where: { campaignId: id } });
  const updated = await prisma.campaign.update({
    where: { id },
    data: { totalRecipients: total, sentCount: 0, failedCount: 0, status: total > 0 ? 'READY' : 'DRAFT' },
  });

  return apiSuccess({ campaign: updated, totalRecipients: total });
}
