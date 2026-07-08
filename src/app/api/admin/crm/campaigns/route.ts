import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/admin/crm/campaigns — liste des campagnes
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const items = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return apiSuccess({ items });
}

// POST /api/admin/crm/campaigns — créer une campagne (brouillon)
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const { name, subject, htmlBody, segment, channel, dailyLimit } = body || {};
  if (!name || !subject || !htmlBody || !segment) {
    return apiError('name, subject, htmlBody et segment sont requis', 400);
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: String(name).slice(0, 200),
      subject: String(subject).slice(0, 300),
      htmlBody: String(htmlBody),
      segment: typeof segment === 'string' ? segment : JSON.stringify(segment),
      channel: channel === 'gmail' ? 'gmail' : 'brevo',
      dailyLimit: Math.min(Math.max(parseInt(dailyLimit, 10) || 300, 1), 1000),
      status: 'DRAFT',
      createdById: admin.id,
    },
  });

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'create',
    entityType: 'campaign',
    entityId: campaign.id,
    details: { name },
    ...meta,
  }).catch(() => {});

  return apiSuccess(campaign, 201);
}
