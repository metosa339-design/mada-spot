import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
// Cron job security - API key or admin session
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;
  if (validApiKey && apiKey === validApiKey) return true;

  // Check admin session for dashboard access
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (sessionId) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      // Article stats
      totalArticles,
      articlesToday,
      articlesLast24h,
      articlesLast7days,
      rssArticles,
      aiEnhancedArticles,
      breakingNewsCount,
      scheduledArticles,
      draftArticles,

      // Task history
      recentTasks,

      // RSS sources
      rssSources,

      // Breaking news
      breakingNews,

      // Scheduled for future
      upcomingScheduled
    ] = await Promise.all([
      db.article.count(),
      db.article.count({ where: { createdAt: { gte: today } } }),
      db.article.count({ where: { createdAt: { gte: last24h } } }),
      db.article.count({ where: { createdAt: { gte: last7days } } }),
      db.article.count({ where: { isFromRSS: true } }),
      db.article.count({ where: { isAiEnhanced: true } }),
      db.article.count({ where: { isBreaking: true, status: 'published' } }),
      db.article.count({ where: { status: 'scheduled' } }),
      db.article.count({ where: { status: 'draft' } }),

      db.scheduledTask.findMany({
        where: { createdAt: { gte: last7days } },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),

      db.rSSSource.findMany({
        orderBy: { lastFetchedAt: 'desc' }
      }),

      db.article.findMany({
        where: { isBreaking: true, status: 'published' },
        select: { id: true, title: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5
      }),

      prisma.article.findMany({
        where: { status: 'scheduled', scheduledAt: { gte: now } },
        select: { id: true, title: true, scheduledAt: true },
        orderBy: { scheduledAt: 'asc' },
        take: 10
      })
    ]);

    // Group tasks by type and status
    const taskStats = {
      sync_rss: { completed: 0, failed: 0, lastRun: null as Date | null },
      enhance_articles: { completed: 0, failed: 0, lastRun: null as Date | null },
      publish_scheduled: { completed: 0, failed: 0, lastRun: null as Date | null }
    };

    for (const task of recentTasks) {
      const type = task.type as keyof typeof taskStats;
      if (taskStats[type]) {
        if (task.status === 'completed') taskStats[type].completed++;
        if (task.status === 'failed') taskStats[type].failed++;
        if (!taskStats[type].lastRun || task.createdAt > taskStats[type].lastRun) {
          taskStats[type].lastRun = task.createdAt;
        }
      }
    }

    // Calculate health status
    const lastSyncTask = recentTasks.find((t: any) => t.type === 'sync_rss' && t.status === 'completed');
    const hoursSinceLastSync = lastSyncTask
      ? (now.getTime() - lastSyncTask.createdAt.getTime()) / (1000 * 60 * 60)
      : 999;

    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    let healthMessage = 'Système fonctionnel';

    if (hoursSinceLastSync > 6) {
      healthStatus = 'warning';
      healthMessage = `Dernier sync RSS il y a ${Math.round(hoursSinceLastSync)} heures`;
    }
    if (hoursSinceLastSync > 24) {
      healthStatus = 'critical';
      healthMessage = `Aucun sync RSS depuis ${Math.round(hoursSinceLastSync)} heures`;
    }

    // Recent task errors
    const recentErrors = recentTasks
      .filter((t: any) => t.status === 'failed')
      .slice(0, 5)
      .map((t: any) => ({
        type: t.type,
        error: t.error,
        timestamp: t.createdAt
      }));

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),

      health: {
        status: healthStatus,
        message: healthMessage,
        lastSyncHoursAgo: Math.round(hoursSinceLastSync * 10) / 10
      },

      articles: {
        total: totalArticles,
        today: articlesToday,
        last24h: articlesLast24h,
        last7days: articlesLast7days,
        fromRSS: rssArticles,
        aiEnhanced: aiEnhancedArticles,
        breaking: breakingNewsCount,
        scheduled: scheduledArticles,
        drafts: draftArticles
      },

      automation: {
        tasks: taskStats,
        recentErrors,
        rssSources: rssSources.map((s: any) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          isActive: s.isActive,
          autoPublish: s.autoPublish,
          lastFetchedAt: s.lastFetchedAt
        }))
      },

      content: {
        breakingNews,
        upcomingScheduled
      }
    });

  } catch (error) {
    logger.error('[Status] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
