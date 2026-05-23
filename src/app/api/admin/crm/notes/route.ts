import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// GET /api/admin/crm/notes?prospectId=... | userId=...
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const prospectId = searchParams.get('prospectId');
  const userId = searchParams.get('userId');
  if (!prospectId && !userId) return apiError('prospectId ou userId requis', 400);

  const notes = await prisma.contactNote.findMany({
    where: prospectId ? { prospectId } : { userId: userId! },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
  return apiSuccess(notes);
}

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try { body = await request.json(); } catch { return apiError('JSON invalide', 400); }

  const content = (body?.content || '').toString().trim();
  if (!content) return apiError('content requis', 400);
  if (!body?.prospectId && !body?.userId) return apiError('prospectId ou userId requis', 400);

  const note = await prisma.contactNote.create({
    data: {
      prospectId: body.prospectId || null,
      userId: body.userId || null,
      content,
      isPinned: !!body.isPinned,
      authorId: admin.id,
    },
  });
  return apiSuccess(note, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try { body = await request.json(); } catch { return apiError('JSON invalide', 400); }
  if (!body?.id) return apiError('id requis', 400);

  const data: any = {};
  if ('content' in body) data.content = body.content;
  if ('isPinned' in body) data.isPinned = body.isPinned;

  const updated = await prisma.contactNote.update({ where: { id: body.id }, data });
  return apiSuccess(updated);
}

export async function DELETE(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return apiError('id requis', 400);
  await prisma.contactNote.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
