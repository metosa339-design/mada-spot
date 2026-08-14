// Mada Spot — Scanner : remontée des logs de scan (auto-sync cloud).
// Le premier scan gagne : un billet déjà validé plus tôt renvoie un conflit
// avec l'heure du premier passage. Réservé aux rôles AGENT / ORGANIZER / ADMIN.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCAN_ROLES = ['ADMIN', 'AGENT', 'ORGANIZER'] as const;

const syncSchema = z.object({
  eventId: z.string().min(1),
  scans: z
    .array(
      z.object({
        qrHash: z.string().min(1),
        scannedAt: z.string().datetime().optional(),
      })
    )
    .min(1)
    .max(1000),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return apiError('Non autorisé', 401);
  if (!SCAN_ROLES.includes(user.role as (typeof SCAN_ROLES)[number])) {
    return apiError('Accès refusé', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { eventId, scans } = parsed.data;

  try {
    const results: Array<{
      qrHash: string;
      status: 'ACCEPTED' | 'ALREADY_SCANNED' | 'NOT_FOUND';
      firstScannedAt?: string | null;
    }> = [];

    for (const scan of scans) {
      const ticket = await prisma.eventTicket.findUnique({
        where: { qrHash: scan.qrHash },
        select: { id: true, isScanned: true, scannedAt: true, order: { select: { eventId: true, paymentStatus: true } } },
      });

      if (!ticket || ticket.order.eventId !== eventId || ticket.order.paymentStatus !== 'PAID') {
        results.push({ qrHash: scan.qrHash, status: 'NOT_FOUND' });
        continue;
      }

      if (ticket.isScanned) {
        results.push({ qrHash: scan.qrHash, status: 'ALREADY_SCANNED', firstScannedAt: ticket.scannedAt?.toISOString() ?? null });
        continue;
      }

      // Premier scan gagne : update conditionnel sur isScanned = false.
      const scannedAt = scan.scannedAt ? new Date(scan.scannedAt) : new Date();
      const upd = await prisma.eventTicket.updateMany({
        where: { id: ticket.id, isScanned: false },
        data: { isScanned: true, scannedAt, scannedById: user.id },
      });

      if (upd.count === 1) {
        results.push({ qrHash: scan.qrHash, status: 'ACCEPTED', firstScannedAt: scannedAt.toISOString() });
      } else {
        // Course perdue : quelqu'un d'autre a validé entre-temps.
        const fresh = await prisma.eventTicket.findUnique({
          where: { id: ticket.id },
          select: { scannedAt: true },
        });
        results.push({ qrHash: scan.qrHash, status: 'ALREADY_SCANNED', firstScannedAt: fresh?.scannedAt?.toISOString() ?? null });
      }
    }

    const accepted = results.filter((r) => r.status === 'ACCEPTED').length;
    return NextResponse.json({ success: true, data: { accepted, total: results.length, results } });
  } catch (err) {
    logger.error('POST /api/ticketing/scan/sync a échoué', err, 'ticketing.scan');
    return apiError('Erreur serveur', 500);
  }
}
