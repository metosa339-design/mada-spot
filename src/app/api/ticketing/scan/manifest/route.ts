// Mada Spot — Scanner : préchargement du manifeste d'un événement.
// L'agent télécharge la liste signée des billets payés pour un contrôle
// 100 % hors-ligne. Réservé aux rôles AGENT / ORGANIZER / ADMIN.

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAuthUser } from '@/lib/auth';
import { signManifest } from '@/lib/ticketing/codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCAN_ROLES = ['ADMIN', 'AGENT', 'ORGANIZER'] as const;

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return apiError('Non autorisé', 401);
  if (!SCAN_ROLES.includes(user.role as (typeof SCAN_ROLES)[number])) {
    return apiError('Accès refusé', 403);
  }

  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) return apiError('eventId requis', 400);

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, startDate: true },
    });
    if (!event) return apiError('Événement introuvable', 404);

    // Seuls les billets des commandes PAYÉES sont contrôlables.
    const tickets = await prisma.eventTicket.findMany({
      where: { order: { eventId, paymentStatus: 'PAID' } },
      select: {
        id: true,
        qrHash: true,
        securityCode: true,
        isScanned: true,
        scannedAt: true,
        ticketType: { select: { name: true } },
        order: { select: { clientName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const entries = tickets.map((t) => ({
      id: t.id,
      qrHash: t.qrHash,
      securityCode: t.securityCode,
      holderName: t.order.clientName,
      category: t.ticketType.name,
      scannedAt: t.isScanned ? t.scannedAt?.toISOString() ?? null : null,
    }));

    // Signature d'intégrité : l'app vérifie que le manifeste n'a pas été altéré.
    const canonical = JSON.stringify({
      eventId: event.id,
      count: entries.length,
      hashes: entries.map((e) => e.qrHash),
    });
    const signature = signManifest(canonical);

    return NextResponse.json({
      success: true,
      data: {
        event: { id: event.id, title: event.title, startDate: event.startDate },
        generatedAt: new Date().toISOString(),
        count: entries.length,
        signature,
        tickets: entries,
      },
    });
  } catch (err) {
    logger.error('GET /api/ticketing/scan/manifest a échoué', err, 'ticketing.scan');
    return apiError('Erreur serveur', 500);
  }
}
