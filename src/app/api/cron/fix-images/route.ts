import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { extractImageFromHtml } from '@/lib/image-extractor';

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

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const deleteGeneric = searchParams.get('deleteGeneric') === 'true';
  const deleteMalagasy = searchParams.get('deleteMalagasy') === 'true';

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    processed: 0,
    updated: 0,
    extracted: 0,
    deleted: 0,
    failed: 0,
    duration: 0
  };

  try {
    // Si deleteMalagasy=true, supprimer les articles en malgache (pas traduits en français)
    if (deleteMalagasy) {
      logger.info(`[FIX-IMAGES] Deleting articles in Malagasy...`);

      // Mots malgaches courants dans les titres
      const malagasyPatterns = [
        'ny ', ' ny ', ' amin', 'tamin', 'momba', 'ankizy', 'tanana',
        'taona', 'farit', 'manana', 'maty ', 'nisotro', 'lehilahy',
        'zazalahikely', 'raikitra', 'halatra', 'hosantarina', 'asaramanitra',
        'fikarakarana', 'manolo', 'synops', 'mijery', 'nilalao', 'amoron',
        'zazakely', 'vehivavy', 'zazavavy', 'mpianatra', 'mpampianatra'
      ];

      const allArticles = await db.article.findMany({
        select: { id: true, title: true }
      });

      const articlesToDelete = allArticles.filter((article: any) => {
        const titleLower = article.title.toLowerCase();
        return malagasyPatterns.some(pattern => titleLower.includes(pattern.toLowerCase()));
      });

      logger.info(`[FIX-IMAGES] Found ${articlesToDelete.length} articles in Malagasy to delete`);

      for (const article of articlesToDelete) {
        try {
          await db.article.delete({ where: { id: article.id } });
          results.deleted++;
          logger.info(`[FIX-IMAGES] Deleted (Malagasy): ${article.title.substring(0, 50)}...`);
        } catch (err) {
          logger.error(`[FIX-IMAGES] Failed to delete ${article.id}:`, err);
          results.failed++;
        }
      }

      results.duration = Date.now() - startTime;
      logger.info(`[FIX-IMAGES] Deleted ${results.deleted} Malagasy articles in ${results.duration}ms`);
      return NextResponse.json(results);
    }

    // Si deleteGeneric=true, supprimer les articles avec images génériques (Pixabay, Pexels, etc.)
    if (deleteGeneric) {
      logger.info(`[FIX-IMAGES] Deleting articles with generic images...`);

      const articlesToDelete = await db.article.findMany({
        where: {
          OR: [
            { imageUrl: { contains: 'pixabay.com' } },
            { imageUrl: { contains: 'pexels.com' } },
            { imageUrl: { contains: 'picsum.photos' } },
            { imageUrl: { contains: 'source.unsplash.com' } },
            { imageUrl: { contains: 'photo-1504711434969-e33886168f5c' } },
            { imageUrl: null },
            { imageUrl: '' },
          ]
        },
        select: { id: true, title: true, imageUrl: true }
      });

      logger.info(`[FIX-IMAGES] Found ${articlesToDelete.length} articles with generic/missing images to delete`);

      for (const article of articlesToDelete) {
        try {
          await db.article.delete({ where: { id: article.id } });
          results.deleted++;
          logger.info(`[FIX-IMAGES] Deleted: ${article.title.substring(0, 50)}...`);
        } catch (err) {
          logger.error(`[FIX-IMAGES] Failed to delete ${article.id}:`, err);
          results.failed++;
        }
      }

      results.duration = Date.now() - startTime;
      logger.info(`[FIX-IMAGES] Deleted ${results.deleted} articles with generic images in ${results.duration}ms`);
      return NextResponse.json(results);
    }

    // Mode normal: essayer de ré-extraire les images des articles problématiques
    logger.info(`[FIX-IMAGES] Starting image fix (limit: ${limit})...`);

    const articlesWithBadImages = await db.article.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' },
          { imageUrl: { contains: 'pixabay.com' } },
          { imageUrl: { contains: 'pexels.com' } },
          { imageUrl: { contains: 'picsum.photos' } },
          { imageUrl: { contains: 'source.unsplash.com' } },
          { imageUrl: { contains: 'photo-1504711434969-e33886168f5c' } },
        ]
      },
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        imageUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    logger.info(`[FIX-IMAGES] Found ${articlesWithBadImages.length} articles to fix`);

    for (const article of articlesWithBadImages) {
      results.processed++;

      try {
        let newImageUrl: string | null = null;

        // Essayer d'extraire l'image depuis la page source
        if (article.sourceUrl) {
          try {
            const response = await fetch(article.sourceUrl, {
              headers: {
                'User-Agent': 'MadaSpotBot/1.0 (+https://madaspot.mg)',
                'Accept': 'text/html',
              },
              signal: AbortSignal.timeout(10000),
            });

            if (response.ok) {
              const html = await response.text();
              const extracted = extractImageFromHtml(html, article.sourceUrl);
              if (extracted.url) {
                newImageUrl = extracted.url;
                results.extracted++;
                logger.info(`[FIX-IMAGES] Extracted (${extracted.source}): ${article.title.substring(0, 40)}...`);
              }
            }
          } catch {
            // Ignorer les erreurs de fetch
          }
        }

        if (newImageUrl) {
          // Mettre à jour avec l'image extraite
          await db.article.update({
            where: { id: article.id },
            data: { imageUrl: newImageUrl }
          });
          results.updated++;
        } else {
          // Si pas d'image trouvée, supprimer l'article
          await db.article.delete({ where: { id: article.id } });
          results.deleted++;
          logger.info(`[FIX-IMAGES] Deleted (no image found): ${article.title.substring(0, 40)}...`);
        }

        // Petit délai
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        results.failed++;
        logger.error(`[FIX-IMAGES] Error fixing ${article.id}:`, error);
      }
    }

    results.duration = Date.now() - startTime;

    logger.info(`[FIX-IMAGES] Completed: updated=${results.updated}, deleted=${results.deleted}, failed=${results.failed} in ${results.duration}ms`);

    return NextResponse.json(results);

  } catch (error) {
    logger.error('[FIX-IMAGES] Error:', error);
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
