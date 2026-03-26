import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;

import { logger } from '@/lib/logger';
// Helper to check authentication

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    const contact = await db.emergencyContact.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        phone: data.phone,
        phone2: data.phone2 || null,
        city: data.city || null,
        address: data.address || null,
        description: data.description || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        is24h: data.is24h || false,
        isActive: data.isActive !== false,
        order: data.order || 0,
      }
    });

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    logger.error('Error updating emergency contact:', error);
    return NextResponse.json({ success: false, error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await db.emergencyContact.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting emergency contact:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete contact' }, { status: 500 });
  }
}
