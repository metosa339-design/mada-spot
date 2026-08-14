// Mada Spot — Admin billetterie : liste des demandes de virement organisateurs.

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAdminSession } from '@/lib/ticketing/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/ticketing/payouts?status=PENDING
export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const status = new URL(request.url).searchParams.get('status');
  try {
    const requests = await prisma.payoutRequest.findMany({
      where: status ? { status: status as never } : {},
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        amount: true,
        status: true,
        provider: true,
        mobileMoneyNumber: true,
        processedAt: true,
        createdAt: true,
        organizer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        amount: r.amount.toString(),
        status: r.status,
        provider: r.provider,
        mobileMoneyNumber: r.mobileMoneyNumber,
        processedAt: r.processedAt,
        createdAt: r.createdAt,
        organizerName: `${r.organizer.firstName} ${r.organizer.lastName}`.trim(),
        organizerPhone: r.organizer.phone,
      })),
    });
  } catch (err) {
    logger.error('GET admin/ticketing/payouts a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
