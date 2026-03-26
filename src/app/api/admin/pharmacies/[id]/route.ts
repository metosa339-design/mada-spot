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

    const pharmacy = await db.pharmacy.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        district: data.district,
        phone: data.phone,
        phone2: data.phone2,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        guardDate: data.guardDate ? new Date(data.guardDate) : null,
        isOnGuard: data.isOnGuard || false,
        isActive: data.isActive !== false,
      }
    });

    return NextResponse.json({ success: true, pharmacy });
  } catch (error) {
    logger.error('Error updating pharmacy:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await db.pharmacy.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting pharmacy:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete pharmacy' }, { status: 500 });
  }
}
