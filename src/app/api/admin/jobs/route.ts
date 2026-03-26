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
    const jobs = await db.job.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
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

    const job = await db.job.create({
      data: {
        title: data.title,
        company: data.company,
        companyLogo: data.companyLogo || null,
        description: data.description || '',
        location: data.location || 'Madagascar',
        salary: data.salary || null,
        type: data.type || data.contractType || 'CDI',
        url: data.url || null,
        isActive: data.isActive !== false,
      }
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    logger.error('Error creating job:', error);
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
  }
}
