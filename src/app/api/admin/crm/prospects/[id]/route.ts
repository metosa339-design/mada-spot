import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';

// GET /api/admin/crm/prospects/:id — détail enrichi
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await ctx.params;

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      tags: { include: { tag: true } },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
      followUps: {
        orderBy: { dueAt: 'asc' },
        include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      },
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!prospect) return apiError('Prospect introuvable', 404);
  return apiSuccess(prospect);
}

// PATCH /api/admin/crm/prospects/:id — update
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await ctx.params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const allowed = [
    'email', 'phone', 'firstName', 'lastName', 'company', 'city', 'country',
    'status', 'source', 'sourceNote', 'score', 'preferredChannel',
    'optInEmail', 'optInMessenger', 'ownerId',
  ];
  const data: any = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  if (body.unsubscribed === true) {
    data.unsubscribedAt = new Date();
    data.optInEmail = false;
    data.optInMessenger = false;
    data.status = 'UNSUBSCRIBED';
  }

  const updated = await prisma.prospect.update({ where: { id }, data });
  const meta = getRequestMeta(request);
  await logAudit({ userId: admin.id, action: 'update', entityType: 'prospect', entityId: id, details: data, ...meta }).catch(() => {});
  return apiSuccess(updated);
}

// DELETE /api/admin/crm/prospects/:id
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await ctx.params;

  await prisma.prospect.delete({ where: { id } });
  const meta = getRequestMeta(request);
  await logAudit({ userId: admin.id, action: 'delete', entityType: 'prospect', entityId: id, ...meta }).catch(() => {});
  return apiSuccess({ deleted: true });
}
