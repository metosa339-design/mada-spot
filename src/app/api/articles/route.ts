
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { safeJsonParse } from '@/lib/api-response';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET - Public endpoint to fetch published articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const categoryId = searchParams.get('categoryId') || undefined;

    const where: any = {
      status: 'published',
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const articles = await db.article.findMany({
      where,
      include: { category: true },
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
    });

    // Transform to match the NewsArticle type expected by the frontend
    const transformedArticles = articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary || article.content.substring(0, 200) + '...',
      content: article.content,
      imageUrl: article.imageUrl || null,
      additionalImages: safeJsonParse(article.additionalImages, []),
      category: article.category?.name || 'Actualités',
      categoryColor: article.category?.color || '#ff6b35',
      source: {
        id: 'mada-spot',
        name: article.sourceName || 'Mada Spot',
        logo: '/logo.png',
      },
      publishedAt: article.publishedAt || article.createdAt,
      isFeatured: article.isFeatured,
      isBreaking: article.isBreaking,
      tags: [],
      sourceUrl: article.sourceUrl,
      layoutFormat: article.layoutFormat || 1,
      titleBold: article.titleBold || false,
    }));

    return NextResponse.json({
      success: true,
      articles: transformedArticles,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching public articles:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
