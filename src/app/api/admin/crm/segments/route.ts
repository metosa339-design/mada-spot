import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/crm/segments — segments enregistrés
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const items = await prisma.savedSegment.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return apiSuccess({ items });
}

// POST /api/admin/crm/segments — enregistrer un segment
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const { name, filter, description } = body || {};
  if (!name || !filter) return apiError('name et filter requis', 400);
  const seg = await prisma.savedSegment.create({
    data: {
      name: String(name).slice(0, 120),
      description: description ? String(description) : null,
      filter: typeof filter === 'string' ? filter : JSON.stringify(filter),
      createdById: admin.id,
    },
  });
  return apiSuccess(seg, 201);
}
