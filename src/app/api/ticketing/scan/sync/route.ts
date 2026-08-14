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

    // 1) Résolution en UNE requête (au lieu d'un findUnique par scan).
    const qrHashes = [...new Set(scans.map((s) => s.qrHash))];
    const found = await prisma.eventTicket.findMany({
      where: { qrHash: { in: qrHashes } },
      select: { id: true, qrHash: true, isScanned: true, scannedAt: true, order: { select: { eventId: true, paymentStatus: true } } },
    });
    const byHash = new Map(found.map((t) => [t.qrHash, t]));

    // 2) Décision + validation. On conserve l'heure de scan fournie par
    //    l'appareil (plus juste que l'heure de synchronisation).
    for (const scan of scans) {
      const ticket = byHash.get(scan.qrHash);
      if (!ticket || ticket.order.eventId !== eventId || ticket.order.paymentStatus !== 'PAID') {
        results.push({ qrHash: scan.qrHash, status: 'NOT_FOUND' });
        continue;
      }
      if (ticket.isScanned) {
        results.push({ qrHash: scan.qrHash, status: 'ALREADY_SCANNED', firstScannedAt: ticket.scannedAt?.toISOString() ?? null });
        continue;
      }

      const scannedAt = scan.scannedAt ? new Date(scan.scannedAt) : new Date();
      const upd = await prisma.eventTicket.updateMany({
        where: { id: ticket.id, isScanned: false },
        data: { isScanned: true, scannedAt, scannedById: user.id },
      });
      if (upd.count === 1) {
        // Évite une re-lecture pour les doublons du même lot.
        ticket.isScanned = true;
        ticket.scannedAt = scannedAt;
        results.push({ qrHash: scan.qrHash, status: 'ACCEPTED', firstScannedAt: scannedAt.toISOString() });
      } else {
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
