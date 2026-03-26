import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';


import { logger } from '@/lib/logger';
// GET /api/admin/audit - Consulter les logs d'audit
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const entityType = searchParams.get('entityType');
  const userId = searchParams.get('userId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

  try {
    const where: any = {};
    if (action && action !== 'all') where.action = action;
    if (entityType && entityType !== 'all') where.entityType = entityType;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse JSON details
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      details: safeJsonParse(log.details, null),
    }));

    return NextResponse.json({ success: true, logs: parsedLogs, total });
  } catch (error: unknown) {
    logger.error('[ADMIN AUDIT] List error:', error);
    return apiError('Erreur serveur', 500);
  }
}
