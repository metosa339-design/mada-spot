import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const ads = await prisma.advertisement.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ success: true, ads });
  } catch (error) {
    logger.error('Error fetching ads:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const data = await request.json().catch(() => null);
    if (!data) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

    if (!data.name || !data.position || !data.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants: name, position, imageUrl' },
        { status: 400 }
      );
    }

    const ad = await prisma.advertisement.create({
      data: {
        name: data.name,
        position: data.position,
        format: data.format || 'auto',
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        altText: data.altText || null,
        isActive: data.isActive !== false,
        priority: typeof data.priority === 'number' ? data.priority : 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    logger.error('Error creating ad:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
