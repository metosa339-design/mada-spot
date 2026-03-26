import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const ad = await prisma.advertisement.findUnique({ where: { id } });
    if (!ad) return NextResponse.json({ success: false, error: 'Publicité introuvable' }, { status: 404 });
    return NextResponse.json({ success: true, ad });
  } catch (error) {
    logger.error('Error fetching ad:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const data = await request.json().catch(() => null);
    if (!data) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl || null;
    if (data.altText !== undefined) updateData.altText = data.altText || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.priority !== undefined) updateData.priority = Number(data.priority);
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const ad = await prisma.advertisement.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, ad });
  } catch (error) {
    logger.error('Error updating ad:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.advertisement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting ad:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
