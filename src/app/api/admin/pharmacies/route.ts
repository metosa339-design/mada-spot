import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;

import { logger } from '@/lib/logger';
// Helper to check authentication

export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const pharmacies = await db.pharmacy.findMany({
      orderBy: [
        { city: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, pharmacies });
  } catch (error) {
    logger.error('Error fetching pharmacies:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pharmacies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    const pharmacy = await db.pharmacy.create({
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
    logger.error('Error creating pharmacy:', error);
    return NextResponse.json({ success: false, error: 'Failed to create pharmacy' }, { status: 500 });
  }
}
