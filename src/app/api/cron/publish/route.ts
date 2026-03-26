import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cron job security - API key only
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;
  if (!validApiKey) return false;
  return apiKey === validApiKey;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    articlesPublished: 0,
    articles: [] as { id: string; title: string; scheduledAt: string }[],
    duration: 0
  };

  try {
    const now = new Date();
    logger.info(`[CRON] Starting scheduled publishing at ${now.toISOString()}...`);

    // 1. Publish scheduled articles
    const scheduledArticles = await prisma.article.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: now }
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true
      }
    });

    logger.info(`[CRON] Found ${scheduledArticles.length} scheduled articles to publish`);

    for (const article of scheduledArticles) {
      try {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            status: 'published',
            publishedAt: now
          }
        });

        results.articlesPublished++;
        results.articles.push({
          id: article.id,
          title: article.title,
          scheduledAt: article.scheduledAt?.toISOString() || ''
        });

        logger.info(`[CRON] Published article: ${article.title.substring(0, 50)}...`);
      } catch (error) {
        logger.error(`[CRON] Failed to publish article ${article.id}:`, error);
      }
    }

    // 2. Clean up old completed tasks (older than 30 days)
    await prisma.scheduledTask.deleteMany({
      where: {
        status: { in: ['completed', 'failed'] },
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    results.duration = Date.now() - startTime;

    // Log this run
    await prisma.scheduledTask.create({
      data: {
        type: 'publish_scheduled',
        status: 'completed',
        duration: results.duration,
        result: JSON.stringify({
          articles: results.articlesPublished,
          duration: results.duration
        })
      }
    });

    logger.info(`[CRON] Publishing completed: ${results.articlesPublished} articles in ${results.duration}ms`);

    return NextResponse.json(results);

  } catch (error) {
    logger.error('[CRON] Publishing error:', error);

    await prisma.scheduledTask.create({
      data: {
        type: 'publish_scheduled',
        status: 'failed',
        error: (error as Error).message
      }
    }).catch(() => {});

    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
