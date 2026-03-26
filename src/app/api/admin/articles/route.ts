import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { articleCreateSchema, articleQuerySchema, validateData, sanitizeContent } from '@/lib/validations';

import { logger } from '@/lib/logger';
// Helper to check authentication

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - List all articles with pagination and filters
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters with Zod
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const validation = validateData(articleQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides', details: validation.errors },
        { status: 400 }
      );
    }

    const { page, limit, status, categoryId, search } = validation.data;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Create a new article
export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // Validate input with Zod
    const validation = validateData(articleCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      summary,
      categoryId,
      imageUrl,
      additionalImages,
      sourceUrl,
      sourceName,
      status,
      scheduledAt,
      isFeatured,
      isBreaking,
      metaTitle,
      metaDescription,
      layoutFormat,
      titleBold,
    } = validation.data;

    // Sanitize HTML content to prevent XSS
    const sanitizedContent = sanitizeContent(content);

    // Generate unique slug
    let slug = generateSlug(title);
    const existingSlug = await db.article.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const article = await db.article.create({
      data: {
        title,
        slug,
        content: sanitizedContent,
        summary,
        categoryId: categoryId || null,
        imageUrl,
        additionalImages: additionalImages ? JSON.stringify(additionalImages) : null,
        sourceUrl,
        sourceName,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: status === 'published' ? new Date() : null,
        isFeatured: isFeatured || false,
        isBreaking: isBreaking || false,
        metaTitle,
        metaDescription,
        layoutFormat: layoutFormat || 1,
        titleBold: titleBold || false,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, article });
  } catch (error) {
    logger.error('Error creating article:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
