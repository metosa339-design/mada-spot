import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { z } from 'zod';


import { logger } from '@/lib/logger';
// Validation schema for historical events
const historyEventSchema = z.object({
  day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  year: z.coerce.number().int().min(-5000).max(new Date().getFullYear()),
  title: z.string().min(1, 'Titre requis').max(500),
  description: z.string().max(5000).optional().nullable(),
  isMadagascar: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().max(2000).optional().nullable(),
  eraId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET - List all historical events
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const day = searchParams.get('day');

    const where: any = {};

    if (month) {
      where.month = parseInt(month);
    }
    if (day) {
      where.day = parseInt(day);
    }

    const events = await db.historicalEvent.findMany({
      where,
      orderBy: [
        { month: 'asc' },
        { day: 'asc' },
        { year: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    logger.error('Error fetching historical events:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Create a new historical event
export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const validation = historyEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const event = await db.historicalEvent.create({
      data: validation.data,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    logger.error('Error creating historical event:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
