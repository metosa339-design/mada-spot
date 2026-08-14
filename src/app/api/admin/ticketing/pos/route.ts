// Mada Spot — Admin billetterie : réseau de points de vente Cash-to-Digital.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { requireAdminSession, ensureCsrf } from '@/lib/ticketing/admin';

export const dynamic = 'force-dynamic';

const adjustSchema = z.object({
  csrfToken: z.string().optional(),
  vendorId: z.string().min(1),
  cashDelta: z.number().int().optional(),
  commissionDelta: z.number().int().optional(),
  depositCap: z.number().int().min(0).optional(),
});

// GET /api/admin/ticketing/pos — liste des vendeurs + portefeuilles.
export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const vendors = await prisma.user.findMany({
      where: { role: 'POS_VENDOR' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        posWallet: {
          select: { cashBalance: true, totalCommissionsEarned: true, depositCap: true, updatedAt: true },
        },
      },
    });

    // Nombre de commandes encaissées par chaque vendeur.
    const sales = await prisma.ticketOrder.groupBy({
      by: ['posVendorId'],
      where: { posVendorId: { not: null }, paymentStatus: 'PAID' },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    const salesMap = new Map(sales.map((s) => [s.posVendorId, s]));

    return NextResponse.json({
      success: true,
      data: vendors.map((v) => {
        const s = salesMap.get(v.id);
        return {
          id: v.id,
          name: `${v.firstName} ${v.lastName}`.trim(),
          phone: v.phone,
          cashBalance: (v.posWallet?.cashBalance ?? 0).toString(),
          totalCommissionsEarned: (v.posWallet?.totalCommissionsEarned ?? 0).toString(),
          depositCap: (v.posWallet?.depositCap ?? 0).toString(),
          ordersPaid: s?._count._all ?? 0,
          grossSold: (s?._sum.totalAmount ?? 0).toString(),
        };
      }),
    });
  } catch (err) {
    logger.error('GET admin/ticketing/pos a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/admin/ticketing/pos — ajuste le portefeuille d'un vendeur.
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const csrf = ensureCsrf(body);
  if (csrf) return csrf;

  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const { vendorId, cashDelta, commissionDelta, depositCap } = parsed.data;

  try {
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { role: true },
    });
    if (!vendor || vendor.role !== 'POS_VENDOR') return apiError('Vendeur POS introuvable', 404);

    const data: Prisma.PosWalletUpdateInput = { updatedAt: new Date() };
    if (cashDelta !== undefined) data.cashBalance = { increment: new Prisma.Decimal(cashDelta) };
    if (commissionDelta !== undefined) {
      data.totalCommissionsEarned = { increment: new Prisma.Decimal(commissionDelta) };
    }
    if (depositCap !== undefined) data.depositCap = new Prisma.Decimal(depositCap);

    // Ajustement atomique (les increment/decrement sont appliqués en une seule
    // écriture). Le plafond de dépôt est indicatif (seuil de remise en caisse) et
    // n'est pas un verrou transactionnel : il ne bloque ni les ventes ni un
    // ajustement admin, il est simplement affiché dans l'UI.
    const wallet = await prisma.posWallet.upsert({
      where: { vendorId },
      create: {
        vendorId,
        cashBalance: new Prisma.Decimal(cashDelta ?? 0),
        totalCommissionsEarned: new Prisma.Decimal(commissionDelta ?? 0),
        ...(depositCap !== undefined ? { depositCap: new Prisma.Decimal(depositCap) } : {}),
      },
      update: data,
      select: { cashBalance: true, totalCommissionsEarned: true, depositCap: true },
    });

    await logAudit({
      userId: auth.admin.id,
      action: 'TICKETING_POS_ADJUST',
      entityType: 'PosWallet',
      entityId: vendorId,
      details: { cashDelta, commissionDelta, depositCap },
      ...getRequestMeta(request),
    });

    return NextResponse.json({
      success: true,
      data: {
        cashBalance: wallet.cashBalance.toString(),
        totalCommissionsEarned: wallet.totalCommissionsEarned.toString(),
        depositCap: wallet.depositCap.toString(),
      },
    });
  } catch (err) {
    logger.error('POST admin/ticketing/pos a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
