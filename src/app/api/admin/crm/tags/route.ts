import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const tags = await prisma.contactTag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { assignments: true } } },
  });
  return apiSuccess(tags);
}

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try { body = await request.json(); } catch { return apiError('JSON invalide', 400); }

  const name = (body?.name || '').toString().trim();
  if (!name) return apiError('name requis', 400);
  const color = body?.color || null;
  const description = body?.description || null;

  // Assignation directe à un prospect/user si fournie
  const { prospectId, userId } = body || {};

  const tag = await prisma.contactTag.upsert({
    where: { name },
    create: { name, color, description },
    update: { color: color ?? undefined, description: description ?? undefined },
  });

  if (prospectId || userId) {
    await prisma.contactTagAssignment.upsert({
      where: prospectId
        ? { tagId_prospectId: { tagId: tag.id, prospectId } }
        : { tagId_userId: { tagId: tag.id, userId: userId! } },
      create: {
        tagId: tag.id,
        prospectId: prospectId || null,
        userId: userId || null,
      },
      update: {},
    });
  }

  return apiSuccess(tag, 201);
}

export async function DELETE(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');
  const prospectId = searchParams.get('prospectId');
  const userId = searchParams.get('userId');
  if (!tagId) return apiError('tagId requis', 400);

  if (prospectId || userId) {
    await prisma.contactTagAssignment.deleteMany({
      where: { tagId, ...(prospectId ? { prospectId } : {}), ...(userId ? { userId } : {}) },
    });
  } else {
    await prisma.contactTag.delete({ where: { id: tagId } });
  }
  return apiSuccess({ deleted: true });
}
