import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;

// Cron job security - API key only
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;
  if (!validApiKey) return false;
  return apiKey === validApiKey;
}

// AI Enhancement using Groq
async function enhanceArticle(article: {
  id: string;
  title: string;
  content: string;
}): Promise<{
  title: string;
  summary: string;
  content: string;
  category: string;
  isBreaking: boolean;
  metaTitle: string;
  metaDescription: string;
} | null> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    logger.info('[AI] No GROQ_API_KEY configured');
    return null;
  }

  const contentToEnhance = article.content;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Tu es un journaliste malgache professionnel travaillant pour Mada Spot Info, le portail d'actualités de Madagascar.

RÈGLES IMPORTANTES:
1. ÉCRIS TOUJOURS EN FRANÇAIS - c'est obligatoire
2. Si l'article original est en malgache, traduis-le en français
3. Garde le contexte malgache (noms, lieux, institutions de Madagascar)
4. Crée un titre accrocheur et informatif en français (max 100 caractères)
5. Écris un résumé percutant de 2 phrases en français (max 200 caractères)
6. Réécris le contenu en 4-5 paragraphes bien structurés EN FRANÇAIS
7. Garde TOUS les faits et informations importantes
8. Détecte si c'est une actualité URGENTE (accident grave, catastrophe, annonce majeure)
9. Catégorise parmi: Actualités, Sport, Culture, Économie, Politique, International, Société, Faits divers
10. Crée un meta title SEO en français (max 60 caractères)
11. Crée une meta description SEO en français (max 155 caractères)

RÉPONDS UNIQUEMENT EN JSON VALIDE (tout le contenu doit être en FRANÇAIS):
{
  "title": "...",
  "summary": "...",
  "content": "...",
  "category": "...",
  "isBreaking": false,
  "metaTitle": "...",
  "metaDescription": "..."
}`
          },
          {
            role: 'user',
            content: `Titre actuel: ${article.title}\n\nContenu: ${contentToEnhance.substring(0, 3000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[AI] Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) return null;

    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('[AI] No JSON found in response');
      return null;
    }

    let parsed;
    try {
      // Try parsing as-is first
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // If that fails, try cleaning control characters inside string values
      // Replace problematic characters that might be inside JSON string values
      const cleanedJson = jsonMatch[0]
        .replace(/"([^"\\]|\\.)*"/g, (match: string) => {
          // Clean control characters inside string values only
          return match
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        });
      parsed = JSON.parse(cleanedJson);
    }
    return {
      title: parsed.title || article.title,
      summary: parsed.summary || '',
      content: parsed.content || contentToEnhance,
      category: parsed.category || 'Actualités',
      isBreaking: parsed.isBreaking === true,
      metaTitle: parsed.metaTitle || parsed.title?.substring(0, 60) || '',
      metaDescription: parsed.metaDescription || parsed.summary?.substring(0, 155) || ''
    };
  } catch (error) {
    logger.error('[AI] Enhancement error for article', article.id, ':', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
  const force = searchParams.get('force') === 'true';

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    processed: 0,
    enhanced: 0,
    failed: 0,
    skipped: 0,
    breakingNews: 0,
    articles: [] as { id: string; title: string; status: string }[],
    duration: 0
  };

  try {
    logger.info(`[CRON] Starting article enhancement (limit: ${limit}, force: ${force})...`);

    // Find articles to enhance
    const articles = await db.article.findMany({
      where: {
        AND: [
          { isFromRSS: true },
          force ? {} : { isAiEnhanced: false },
          { status: 'published' },
          // Only enhance articles from the last 7 days
          { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        categoryId: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    logger.info(`[CRON] Found ${articles.length} articles to enhance`);

    // Process articles one by one (to avoid rate limits)
    for (const article of articles) {
      results.processed++;

      try {
        const enhanced = await enhanceArticle(article);

        if (!enhanced) {
          results.skipped++;
          results.articles.push({ id: article.id, title: article.title, status: 'skipped' });
          continue;
        }

        // Find or match category
        let categoryId = article.categoryId;
        if (enhanced.category) {
          const category = await db.articleCategory.findFirst({
            where: {
              OR: [
                { name: { contains: enhanced.category, mode: 'insensitive' } },
                { slug: enhanced.category.toLowerCase().replace(/\s+/g, '-') }
              ]
            }
          });
          if (category) categoryId = category.id;
        }

        // Update article
        await db.article.update({
          where: { id: article.id },
          data: {
            title: enhanced.title,
            summary: enhanced.summary,
            content: enhanced.content,
            categoryId,
            isAiEnhanced: true,
            isBreaking: enhanced.isBreaking,
            metaTitle: enhanced.metaTitle,
            metaDescription: enhanced.metaDescription
          }
        });

        results.enhanced++;
        if (enhanced.isBreaking) results.breakingNews++;
        results.articles.push({ id: article.id, title: enhanced.title, status: 'enhanced' });

        logger.info(`[CRON] Enhanced: ${enhanced.title.substring(0, 50)}...`);

        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed++;
        results.articles.push({ id: article.id, title: article.title, status: 'failed' });
        logger.error(`[CRON] Failed to enhance article ${article.id}:`, error);
      }
    }

    results.duration = Date.now() - startTime;

    // Log task
    await db.scheduledTask.create({
      data: {
        type: 'enhance_articles',
        status: 'completed',
        duration: results.duration,
        result: JSON.stringify({
          processed: results.processed,
          enhanced: results.enhanced,
          failed: results.failed,
          breaking: results.breakingNews,
        })
      }
    });

    logger.info(`[CRON] Enhancement completed: ${results.enhanced}/${results.processed} in ${results.duration}ms`);

    return NextResponse.json(results);

  } catch (error) {
    logger.error('[CRON] Enhancement error:', error);

    await db.scheduledTask.create({
      data: {
        type: 'enhance_articles',
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
