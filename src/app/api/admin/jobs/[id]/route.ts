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

    const job = await db.job.update({
      where: { id },
      data: {
        title: data.title,
        company: data.company,
        companyLogo: data.companyLogo || null,
        isActive: data.isActive !== false,
      }
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    logger.error('Error updating job:', error);
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await db.job.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting job:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 });
  }
}
