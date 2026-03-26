import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// API Key authentication for automation system
function checkApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY;

  if (!validApiKey) {
    logger.warn('AUTOMATION_API_KEY not configured');
    return false;
  }

  return apiKey === validApiKey;
}

// Save base64 image to public folder
async function saveBase64Image(base64Data: string, filename: string): Promise<string | null> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'automation');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const finalFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(uploadDir, finalFilename);

    await writeFile(filepath, buffer);
    return `/uploads/automation/${finalFilename}`;
  } catch (error) {
    logger.error('[Automation] Error saving image:', error);
    return null;
  }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// POST - Create article from automation system
export async function POST(request: NextRequest) {
  // Check API key
  if (!checkApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(data.title);
    const existingSlug = await db.article.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Handle image - base64 or URL
    let imageUrl = data.imageUrl || null;
    if (data.imageBase64) {
      const savedUrl = await saveBase64Image(data.imageBase64, 'article.jpg');
      if (savedUrl) {
        imageUrl = savedUrl;
      }
    }

    // Find or use default category
    let categoryId = null;
    if (data.category) {
      const category = await db.articleCategory.findFirst({
        where: {
          OR: [
            { name: { contains: data.category, mode: 'insensitive' } },
            { slug: { contains: data.category.toLowerCase() } }
          ]
        }
      });
      if (category) {
        categoryId = category.id;
      }
    }

    // Create the article
    const article = await db.article.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary || null,
        content: data.content,
        imageUrl,
        categoryId,
        sourceName: data.source || 'Automation',
        sourceUrl: data.sourceUrl || null,
        status: data.isPublished !== false ? 'published' : 'draft',
        publishedAt: data.isPublished !== false ? new Date() : null,
        isFromRSS: true,
        isAiEnhanced: true,
        layoutFormat: data.layoutFormat || 1,
        titleBold: data.titleBold || false,
      },
      include: { category: true },
    });

    logger.info(`[Automation] Article created: ${article.id} - ${article.title}`);

    return NextResponse.json({
      success: true,
      id: article.id,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      }
    });

  } catch (error) {
    logger.error('[Automation] Error creating article:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// GET - List recent automated articles
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const articles = await db.article.findMany({
      where: {
        isFromRSS: true,
        isAiEnhanced: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        sourceName: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles,
    });

  } catch (error) {
    logger.error('[Automation] Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
