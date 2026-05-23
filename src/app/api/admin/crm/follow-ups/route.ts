import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// GET /api/admin/crm/follow-ups
//  Sans paramètre : tous les follow-ups PENDING + OVERDUE
//  ?prospectId / ?userId : filtre cible
//  ?status=PENDING|DONE|...
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const prospectId = searchParams.get('prospectId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const overdueOnly = searchParams.get('overdue') === '1';

  const where: any = {};
  if (prospectId) where.prospectId = prospectId;
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (overdueOnly) {
    where.status = 'PENDING';
    where.dueAt = { lt: new Date() };
  }

  const items = await prisma.followUp.findMany({
    where,
    orderBy: { dueAt: 'asc' },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      prospect: { select: { id: true, firstName: true, lastName: true, email: true, facebookName: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  return apiSuccess(items);
}

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try { body = await request.json(); } catch { return apiError('JSON invalide', 400); }

  const { title, description, dueAt, prospectId, userId, ownerId } = body || {};
  if (!title || !dueAt) return apiError('title et dueAt requis', 400);
  if (!prospectId && !userId) return apiError('prospectId ou userId requis', 400);

  const followUp = await prisma.followUp.create({
    data: {
      title,
      description: description || null,
      dueAt: new Date(dueAt),
      prospectId: prospectId || null,
      userId: userId || null,
      ownerId: ownerId || admin.id,
      status: 'PENDING',
    },
  });
  return apiSuccess(followUp, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try { body = await request.json(); } catch { return apiError('JSON invalide', 400); }
  if (!body?.id) return apiError('id requis', 400);

  const data: any = {};
  if ('title' in body) data.title = body.title;
  if ('description' in body) data.description = body.description;
  if ('dueAt' in body) data.dueAt = new Date(body.dueAt);
  if ('ownerId' in body) data.ownerId = body.ownerId;
  if ('status' in body) {
    data.status = body.status;
    if (body.status === 'DONE') data.completedAt = new Date();
  }

  const updated = await prisma.followUp.update({ where: { id: body.id }, data });
  return apiSuccess(updated);
}

export async function DELETE(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return apiError('id requis', 400);
  await prisma.followUp.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
