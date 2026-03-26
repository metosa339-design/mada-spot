import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { generateArticleImage } from '@/lib/image-generator';

// Cron job security - verify request has valid API key
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;

  if (!validApiKey) {
    logger.error('[CRON] No AUTOMATION_API_KEY or CRON_SECRET configured');
    return false;
  }

  return apiKey === validApiKey;
}

// RSS Sources configuration - Madagascar news portals
// Sources vérifiées et fonctionnelles pour l'extraction automatique
const RSS_SOURCES = [
  // === PRINCIPAUX QUOTIDIENS (vérifiés) ===
  {
    name: "Midi Madagasikara",
    feedUrl: "https://www.midi-madagasikara.mg/feed/",
    category: "Actualités",
    priority: 1
  },
  {
    name: "Madagascar Tribune",
    feedUrl: "https://www.madagascar-tribune.com/spip.php?page=backend",
    category: "Actualités",
    priority: 1
  },
  {
    name: "La Gazette de la Grande Île",
    feedUrl: "https://www.lagazette-dgi.com/feed/",
    category: "Actualités",
    priority: 1
  },

  // === PORTAILS D'ACTUALITÉS EN LIGNE (vérifiés) ===
  {
    name: "Newsmada",
    feedUrl: "https://www.newsmada.com/feed/",
    category: "Actualités",
    priority: 2
  },
  {
    name: "2424.mg",
    feedUrl: "https://www.2424.mg/feed/",
    category: "Actualités",
    priority: 1
  },

  // === CHAÎNES TV / MÉDIAS AUDIOVISUELS (vérifiés) ===
  {
    name: "Ma-TV Madagascar",
    feedUrl: "https://www.matv.mg/feed/",
    category: "Actualités",
    priority: 2
  },
  {
    name: "MBS Madagascar",
    feedUrl: "https://mbs.mg/feed/",
    category: "Actualités",
    priority: 2
  }
];

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  imageUrl?: string;
  rawXml?: string; // Pour l'extraction d'image avancée
}

// Simple RSS parser using fetch
async function parseRSSFeed(feedUrl: string, filterKeywords?: string[]): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'MadaSpotBot/1.0 (+https://madaspot.mg)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      logger.error(`[RSS] Failed to fetch ${feedUrl}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const items: RSSItem[] = [];

    // Simple XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemMatches.slice(0, 10)) { // Max 10 items per source
      const title = extractXMLTag(itemXml, 'title');
      const link = extractXMLTag(itemXml, 'link') || extractXMLTag(itemXml, 'guid');
      const description = extractXMLTag(itemXml, 'description') || extractXMLTag(itemXml, 'content:encoded');
      const pubDate = extractXMLTag(itemXml, 'pubDate');

      if (!title || !link) continue;

      // Skip obituaries
      const titleLower = title.toLowerCase();
      if (titleLower.includes('necrologie') || titleLower.includes('nécrologie') || titleLower.includes('obituaire')) {
        continue;
      }

      // Apply keyword filter if specified
      if (filterKeywords && filterKeywords.length > 0) {
        const textToCheck = (title + ' ' + description).toLowerCase();
        const hasKeyword = filterKeywords.some(kw => textToCheck.includes(kw.toLowerCase()));
        if (!hasKeyword) continue;
      }

      // Extract image from description or media tags
      let imageUrl = extractImageFromXML(itemXml);

      items.push({
        title: cleanText(title),
        link: link.trim(),
        description: cleanText(description || ''),
        pubDate: pubDate || undefined,
        imageUrl: imageUrl || undefined,
        rawXml: itemXml // Garde le XML pour extraction d'image avancée
      });
    }

    return items;
  } catch (error) {
    logger.error(`[RSS] Error parsing ${feedUrl}:`, error);
    return [];
  }
}

function extractXMLTag(xml: string, tagName: string): string | null {
  // Try CDATA first
  const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Regular tag
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractImageFromXML(xml: string): string | null {
  // Try media:content
  const mediaMatch = xml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];

  // Try media:thumbnail
  const thumbMatch = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch) return thumbMatch[1];

  // Try enclosure
  const enclosureMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try img tag in content
  const imgMatch = xml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    const imgUrl = imgMatch[1];
    // Filter out small icons
    if (!imgUrl.includes('gravatar') && !imgUrl.includes('icon') && !imgUrl.includes('logo')) {
      return imgUrl;
    }
  }

  return null;
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

// AI Enhancement using Groq (faster and cheaper than Claude for bulk processing)
async function enhanceArticleWithAI(title: string, content: string): Promise<{
  title: string;
  summary: string;
  content: string;
  category: string;
  isBreaking: boolean;
} | null> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    logger.info('[AI] No GROQ_API_KEY configured, skipping enhancement');
    return null;
  }

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
            content: `Tu es un journaliste malgache professionnel. Réécris les articles de manière claire et engageante en français.

RÈGLES:
- Garde les faits principaux
- Crée un titre accrocheur (max 100 caractères)
- Écris un résumé de 2 phrases
- Réécris le contenu en 3-4 paragraphes bien structurés
- Détecte si c'est une actualité URGENTE (accident grave, catastrophe, annonce officielle majeure)
- Catégorise: Actualités, Sport, Culture, Économie, Politique, International, Société, Faits divers

RÉPONDS UNIQUEMENT EN JSON VALIDE:
{
  "title": "...",
  "summary": "...",
  "content": "...",
  "category": "...",
  "isBreaking": false
}`
          },
          {
            role: 'user',
            content: `Titre: ${title}\n\nContenu: ${content.substring(0, 2000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.error('[AI] Groq API error:', response.status);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) return null;

    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    let parsed;
    try {
      // Try parsing as-is first
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // If that fails, try cleaning control characters inside string values
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
      title: parsed.title || title,
      summary: parsed.summary || content.substring(0, 200),
      content: parsed.content || content,
      category: parsed.category || 'Actualités',
      isBreaking: parsed.isBreaking === true
    };
  } catch (error) {
    logger.error('[AI] Enhancement error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    sources: [] as { name: string; fetched: number; saved: number; imagesExtracted: number; error?: string }[],
    totalFetched: 0,
    totalSaved: 0,
    totalEnhanced: 0,
    totalImagesExtracted: 0,
    breakingNews: 0,
    duration: 0
  };

  try {
    logger.info('[CRON] Starting RSS sync...');

    // Also fetch from database RSSSource if configured
    const dbSources = await db.rSSSource.findMany({
      where: { isActive: true }
    });

    const allSources = [
      ...RSS_SOURCES,
      ...dbSources.map((s: any) => ({
        name: s.name,
        feedUrl: s.url,
        category: 'Actualités',
        priority: 2
      }))
    ];

    // Process sources in parallel (max 3 concurrent)
    const chunks = [];
    for (let i = 0; i < allSources.length; i += 3) {
      chunks.push(allSources.slice(i, i + 3));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (source) => {
          const sourceResult = { name: source.name, fetched: 0, saved: 0, imagesExtracted: 0, error: undefined as string | undefined };

          try {
            const items = await parseRSSFeed(source.feedUrl, (source as any).filterKeywords);
            sourceResult.fetched = items.length;

            for (const item of items) {
              // Check if article already exists
              const existing = await db.article.findFirst({
                where: {
                  OR: [
                    { sourceUrl: item.link },
                    { slug: generateSlug(item.title) }
                  ]
                }
              });

              if (existing) continue;

              // Find category
              let categoryId = null;
              const category = await db.articleCategory.findFirst({
                where: {
                  OR: [
                    { name: { contains: source.category, mode: 'insensitive' } },
                    { slug: source.category.toLowerCase() }
                  ]
                }
              });
              if (category) categoryId = category.id;

              // Try AI enhancement
              const enhanced = await enhanceArticleWithAI(item.title, item.description);

              // Déterminer la catégorie pour l'image
              const articleCategory = enhanced?.category || source.category || 'Actualités';
              const articleTitle = enhanced?.title || item.title;
              const articleSummary = enhanced?.summary || item.description.substring(0, 300);

              // Extraire l'image réelle de la source OU générer avec IA
              const imageResult = await generateArticleImage(
                articleTitle,
                articleCategory,
                articleSummary,
                item.link,  // URL source pour extraction d'image
                item.rawXml // RSS entry pour extraction media:content
              );
              let finalImageUrl = imageResult.url;

              // Fallback vers image générée par code si aucune image trouvée
              if (!finalImageUrl) {
                const params = new URLSearchParams({
                  title: articleTitle.substring(0, 100),
                  category: articleCategory,
                });
                finalImageUrl = `/api/og?${params.toString()}`;
                logger.info(`[RSS] Using fallback OG image for: "${articleTitle.substring(0, 40)}..."`);
              } else {
                logger.info(`[RSS] Generated ${imageResult.source} image for: "${articleTitle.substring(0, 40)}..."`);
              }

              // Generate unique slug
              let slug = generateSlug(enhanced?.title || item.title);
              const existingSlug = await db.article.findUnique({ where: { slug } });
              if (existingSlug) {
                slug = `${slug}-${Date.now()}`;
              }

              // Create article avec image générée automatiquement
              await db.article.create({
                data: {
                  title: articleTitle,
                  slug,
                  summary: enhanced?.summary || item.description.substring(0, 300),
                  content: enhanced?.content || item.description,
                  imageUrl: finalImageUrl,
                  sourceUrl: item.link,
                  sourceName: source.name,
                  categoryId,
                  status: 'published',
                  publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                  isFromRSS: true,
                  isAiEnhanced: enhanced !== null,
                  isBreaking: enhanced?.isBreaking || false,
                }
              });

              sourceResult.saved++;
              sourceResult.imagesExtracted++;
              if (enhanced) results.totalEnhanced++;
              if (enhanced?.isBreaking) results.breakingNews++;
            }
          } catch (error) {
            sourceResult.error = (error as Error).message;
            logger.error(`[RSS] Error processing ${source.name}:`, error);
          }

          return sourceResult;
        })
      );

      results.sources.push(...chunkResults);
    }

    // Update RSS source last fetched timestamps
    await db.rSSSource.updateMany({
      where: { isActive: true },
      data: { lastFetchedAt: new Date() }
    });

    // Calculate totals
    results.totalFetched = results.sources.reduce((acc, s) => acc + s.fetched, 0);
    results.totalSaved = results.sources.reduce((acc, s) => acc + s.saved, 0);
    results.totalImagesExtracted = results.sources.reduce((acc, s) => acc + s.imagesExtracted, 0);
    results.duration = Date.now() - startTime;

    // Log to scheduled tasks
    await db.scheduledTask.create({
      data: {
        type: 'sync_rss',
        status: 'completed',
        duration: results.duration,
        result: JSON.stringify({
          fetched: results.totalFetched,
          saved: results.totalSaved,
          enhanced: results.totalEnhanced,
          images: results.totalImagesExtracted,
          breaking: results.breakingNews,
        })
      }
    });

    logger.info(`[CRON] RSS sync completed: ${results.totalSaved} new articles in ${results.duration}ms`);

    return NextResponse.json(results);

  } catch (error) {
    logger.error('[CRON] RSS sync error:', error);

    await db.scheduledTask.create({
      data: {
        type: 'sync_rss',
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

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
