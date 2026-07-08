import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await params;
  await prisma.savedSegment.delete({ where: { id } }).catch(() => {});
  return apiSuccess({ deleted: true });
}
