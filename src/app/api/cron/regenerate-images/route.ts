import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { generateArticleImage } from '@/lib/image-generator';

// Cron job security - API key only
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;
  if (!validApiKey) return false;
  return apiKey === validApiKey;
}

// Fallback: génère l'URL de l'image OG
function generateOgImageUrl(title: string, category: string): string {
  const params = new URLSearchParams({
    title: title.substring(0, 100),
    category: category,
  });
  return `/api/og?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const useAI = searchParams.get('useAI') !== 'false'; // Par défaut, utiliser l'IA

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    processed: 0,
    updated: 0,
    extracted: 0,   // Images extraites des sources originales (vraies photos!)
    ai: 0,          // Images générées par Pollinations AI
    pixabay: 0,
    pexels: 0,
    fallback: 0,
    failed: 0,
    duration: 0
  };

  try {
    logger.info(`[REGENERATE-IMAGES] Starting image regeneration (limit: ${limit}, useAI: ${useAI})...`);

    // Récupérer les articles avec leurs catégories, résumés et URL source
    const articles = await db.article.findMany({
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        sourceUrl: true,  // URL de l'article original pour extraire l'image
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    logger.info(`[REGENERATE-IMAGES] Found ${articles.length} articles to process`);

    for (const article of articles) {
      results.processed++;

      try {
        const categoryName = article.category?.name || 'Actualités';
        let newImageUrl: string | null = null;
        let source: string = 'fallback';

        if (useAI) {
          // Utiliser le générateur d'images IA + analyse de l'image originale
          const imageResult = await generateArticleImage(
            article.title,
            categoryName,
            article.summary || undefined,
            article.sourceUrl || undefined  // Passer l'URL source pour analyser l'image originale
          );

          if (imageResult.url) {
            newImageUrl = imageResult.url;
            source = imageResult.source || 'unknown';

            // Compteurs par source
            if (source === 'extracted') results.extracted++;
            else if (source === 'ai') results.ai++;
            else if (source === 'pixabay') results.pixabay++;
            else if (source === 'pexels') results.pexels++;
          }
        }

        // Fallback vers image OG générée par code
        if (!newImageUrl) {
          newImageUrl = generateOgImageUrl(article.title, categoryName);
          source = 'fallback';
          results.fallback++;
        }

        // Mettre à jour l'article avec la nouvelle URL d'image
        await db.article.update({
          where: { id: article.id },
          data: { imageUrl: newImageUrl }
        });

        results.updated++;
        logger.info(`[REGENERATE-IMAGES] Updated (${source}): ${article.title.substring(0, 40)}...`);

        // Délai entre les requêtes pour éviter le rate limiting (plus long car on fait plusieurs API calls)
        if (useAI) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        results.failed++;
        logger.error(`[REGENERATE-IMAGES] Error updating ${article.id}:`, error);
      }
    }

    results.duration = Date.now() - startTime;

    logger.info(`[REGENERATE-IMAGES] Completed: updated=${results.updated}, extracted=${results.extracted}, ai=${results.ai}, pixabay=${results.pixabay}, pexels=${results.pexels}, fallback=${results.fallback} in ${results.duration}ms`);

    return NextResponse.json(results);

  } catch (error) {
    logger.error('[REGENERATE-IMAGES] Error:', error);
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
