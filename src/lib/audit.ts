import { prisma } from './db';

import { logger } from '@/lib/logger';
interface AuditLogEntry {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Enregistre une action dans le journal d'audit
 * Fire-and-forget : ne bloque pas le flux principal
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    logger.error('[AUDIT] Failed to log:', error);
  }
}

/**
 * Helper pour extraire IP et User-Agent d'une NextRequest
 */
export function getRequestMeta(request: Request) {
  return {
    ipAddress: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim(),
    userAgent: request.headers.get('user-agent') || null,
  };
}
