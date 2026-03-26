import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/cleanup — preview cleanup counts
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  try {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [
      inactiveAccounts,
      oldReadMessages,
      orphanedViews,
      oldAuditLogs,
    ] = await Promise.all([
      // Users who haven't logged in for 6+ months and have no bookings
      prisma.user.count({
        where: {
          role: 'CLIENT',
          lastLoginAt: { lt: sixMonthsAgo },
          bookings: { none: {} },
          sentMessages: { none: {} },
        },
      }),
      // Read messages older than 1 year
      prisma.message.count({
        where: {
          isRead: true,
          createdAt: { lt: oneYearAgo },
        },
      }),
      // Views older than 1 year (for storage cleanup)
      prisma.establishmentView.count({
        where: {
          createdAt: { lt: oneYearAgo },
        },
      }),
      // Audit logs older than 1 year
      prisma.auditLog.count({
        where: {
          createdAt: { lt: oneYearAgo },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      preview: {
        inactiveAccounts,
        oldReadMessages,
        orphanedViews,
        oldAuditLogs,
        totalCleanable: inactiveAccounts + oldReadMessages + orphanedViews + oldAuditLogs,
      },
    });
  } catch (err) {
    console.error('Cleanup preview error:', err);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/admin/cleanup — execute cleanup
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  try {
    const body = await request.json();
    const { type, dryRun = true } = body;

    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    let count = 0;
    let description = '';

    switch (type) {
      case 'inactive_accounts': {
        if (dryRun) {
          count = await prisma.user.count({
            where: {
              role: 'CLIENT',
              lastLoginAt: { lt: sixMonthsAgo },
              bookings: { none: {} },
              sentMessages: { none: {} },
            },
          });
        } else {
          const result = await prisma.user.deleteMany({
            where: {
              role: 'CLIENT',
              lastLoginAt: { lt: sixMonthsAgo },
              bookings: { none: {} },
              sentMessages: { none: {} },
            },
          });
          count = result.count;
        }
        description = `Comptes inactifs (6+ mois sans login, sans reservations/messages)`;
        break;
      }
      case 'old_messages': {
        if (dryRun) {
          count = await prisma.message.count({
            where: { isRead: true, createdAt: { lt: oneYearAgo } },
          });
        } else {
          const result = await prisma.message.deleteMany({
            where: { isRead: true, createdAt: { lt: oneYearAgo } },
          });
          count = result.count;
        }
        description = `Messages lus de plus d'un an`;
        break;
      }
      case 'old_views': {
        if (dryRun) {
          count = await prisma.establishmentView.count({
            where: { createdAt: { lt: oneYearAgo } },
          });
        } else {
          const result = await prisma.establishmentView.deleteMany({
            where: { createdAt: { lt: oneYearAgo } },
          });
          count = result.count;
        }
        description = `Vues de plus d'un an`;
        break;
      }
      case 'old_audit_logs': {
        if (dryRun) {
          count = await prisma.auditLog.count({
            where: { createdAt: { lt: oneYearAgo } },
          });
        } else {
          const result = await prisma.auditLog.deleteMany({
            where: { createdAt: { lt: oneYearAgo } },
          });
          count = result.count;
        }
        description = `Logs d'audit de plus d'un an`;
        break;
      }
      default:
        return apiError('Type de nettoyage non reconnu', 400);
    }

    // Log the cleanup
    await prisma.auditLog.create({
      data: {
        action: dryRun ? 'cleanup_preview' : 'cleanup_execute',
        entityType: 'system',
        userId: admin.id,
        details: JSON.stringify({ type, dryRun, count, description }),
      },
    });

    return NextResponse.json({
      success: true,
      dryRun,
      type,
      count,
      description,
      message: dryRun
        ? `Apercu : ${count} element${count > 1 ? 's' : ''} a nettoyer`
        : `Nettoyage termine : ${count} element${count > 1 ? 's' : ''} supprime${count > 1 ? 's' : ''}`,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return apiError('Erreur serveur', 500);
  }
}
