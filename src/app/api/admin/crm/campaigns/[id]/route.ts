import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/crm/campaigns/[id] — détail + stats + derniers destinataires
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return apiError('Campagne introuvable', 404);

  const [byStatus, recent] = await Promise.all([
    prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { _all: true },
    }),
    prisma.campaignRecipient.findMany({
      where: { campaignId: id },
      orderBy: { sentAt: 'desc' },
      take: 20,
      select: { email: true, status: true, sentAt: true, error: true },
    }),
  ]);

  const stats: Record<string, number> = { PENDING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 };
  for (const s of byStatus) stats[s.status] = s._count._all;

  return apiSuccess({ campaign, stats, recent });
}

// DELETE /api/admin/crm/campaigns/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  await prisma.campaign.delete({ where: { id } }).catch(() => {});
  return apiSuccess({ deleted: true });
}
