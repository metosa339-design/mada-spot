import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.type !== undefined) data.type = body.type;
    if (body.level !== undefined) data.level = body.level;
    if (body.title !== undefined) data.title = body.title;
    if (body.message !== undefined) data.message = body.message;
    if (body.regions !== undefined) data.regions = body.regions || null;
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const alert = await prisma.weatherAlert.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    logger.error('Error updating weather alert:', error);
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
    await prisma.weatherAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting weather alert:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
