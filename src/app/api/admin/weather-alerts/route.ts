import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const alerts = await prisma.weatherAlert.findMany({
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    });
    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    logger.error('Error fetching admin weather alerts:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, level, title, message, regions, startDate, endDate, isActive } = body;

    if (!type || !level || !title || !message || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : type, level, title, message, startDate' },
        { status: 400 },
      );
    }

    const alert = await prisma.weatherAlert.create({
      data: {
        type,
        level,
        title,
        message,
        regions: regions || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error) {
    logger.error('Error creating weather alert:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
