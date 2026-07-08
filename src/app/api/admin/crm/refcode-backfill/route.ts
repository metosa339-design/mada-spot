import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { format } from '@/lib/crm/refcode';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/admin/crm/refcode-backfill
// Attribue un ID lisible (ID001…) aux contacts qui n'en ont pas, en ordre global de création.
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const [users, prospects, counter] = await Promise.all([
    prisma.user.findMany({ where: { refCode: null }, select: { id: true, createdAt: true } }),
    prisma.prospect.findMany({ where: { refCode: null }, select: { id: true, createdAt: true } }),
    prisma.counter.findUnique({ where: { name: 'contact' } }),
  ]);

  const combined = [
    ...users.map((u) => ({ kind: 'user' as const, id: u.id, createdAt: u.createdAt })),
    ...prospects.map((p) => ({ kind: 'prospect' as const, id: p.id, createdAt: p.createdAt })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  let value = counter?.value ?? 0;
  let assigned = 0;

  for (const item of combined) {
    value += 1;
    const code = format(value);
    if (item.kind === 'user') {
      await prisma.user.update({ where: { id: item.id }, data: { refCode: code } }).catch(() => {});
    } else {
      await prisma.prospect.update({ where: { id: item.id }, data: { refCode: code } }).catch(() => {});
    }
    assigned++;
  }

  await prisma.counter.upsert({
    where: { name: 'contact' },
    create: { name: 'contact', value },
    update: { value },
  });

  return apiSuccess({ assigned, counter: value });
}
