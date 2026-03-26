import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - List all categories
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const categories = await prisma.articleCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Create category
export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const { name, color, order } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nom requis' },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    const existing = await prisma.articleCategory.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const category = await prisma.articleCategory.create({
      data: {
        name,
        slug,
        color: color || '#ff6b35',
        order: order || 0,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    logger.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
