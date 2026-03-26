import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { z } from 'zod';


import { logger } from '@/lib/logger';
// Validation schema for historical events
const historyEventUpdateSchema = z.object({
  day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  year: z.coerce.number().int().min(-5000).max(new Date().getFullYear()).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  isMadagascar: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  imageUrl: z.string().max(2000).optional().nullable(),
  eraId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const event = await db.historicalEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    logger.error('Error fetching event:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const validation = historyEventUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const event = await db.historicalEvent.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    logger.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.historicalEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
