import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/crm/campaigns/[id]/retry — remet les destinataires en ÉCHEC à PENDING
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;

  const res = await prisma.campaignRecipient.updateMany({
    where: { campaignId: id, status: 'FAILED' },
    data: { status: 'PENDING', error: null },
  });

  await prisma.campaign.update({
    where: { id },
    data: { status: res.count > 0 ? 'READY' : undefined, failedCount: 0 },
  }).catch(() => {});

  return apiSuccess({ reset: res.count });
}
