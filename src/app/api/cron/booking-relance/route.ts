// Cron job: Relance automatique des réservations PENDING
// Exécuté toutes les 4 heures par le scheduler interne
// [BOOKING_AUTO_RECOVERY_ACTIVE]

import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNotification } from '@/lib/email';
import { logAudit } from '@/lib/audit';

// Cron job security - API key only
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const validApiKey = process.env.AUTOMATION_API_KEY || process.env.CRON_SECRET;
  if (!validApiKey) return false;
  return apiKey === validApiKey;
}

// Seuils de relance (en heures)
const RELANCE_PROVIDER_HOURS = 12;
const RELANCE_TRAVELER_HOURS = 24;
const EXPIRE_HOURS = 48;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const startTime = Date.now();
  const now = new Date();
  const results = {
    success: true,
    timestamp: now.toISOString(),
    relancesProvider: 0,
    relancesTraveler: 0,
    expired: 0,
    errors: 0,
    duration: 0,
  };

  try {
    logger.info('[BOOKING_RELANCE] Démarrage du job de relance des réservations...');

    // Récupérer toutes les réservations PENDING
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'pending',
        expiredAt: null, // Pas encore expirées
      },
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            city: true,
            type: true,
            claimedByUserId: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    logger.info(`[BOOKING_RELANCE] ${pendingBookings.length} réservation(s) en attente trouvée(s)`);

    for (const booking of pendingBookings) {
      const hoursWaiting = (now.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60);

      try {
        // =============================================
        // ÉTAPE 3 : Après 48h → EXPIRATION
        // =============================================
        if (hoursWaiting >= EXPIRE_HOURS && booking.relanceCount >= 2) {
          // Passer le statut à EXPIRED (on utilise 'cancelled' avec une raison spécifique)
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'cancelled',
              cancelReason: 'Expiration automatique — prestataire non réactif (48h sans réponse)',
              cancelledAt: now,
              expiredAt: now,
              lastRelanceAt: now,
              relanceCount: { increment: 1 },
            },
          });

          // Notifier le voyageur
          if (booking.user.email) {
            await sendNotification({
              to: booking.user.email,
              type: 'booking_expired' as any,
              userId: booking.user.id,
              data: {
                reference: booking.reference,
                establishmentName: booking.establishment.name,
                checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                checkOut: booking.checkOut?.toLocaleDateString('fr-FR'),
                entityType: 'booking',
                entityId: booking.id,
              },
            }).catch(() => {});
          }

          // Notifier l'admin
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@madaspot.com';
          await sendNotification({
            to: adminEmail,
            type: 'reminder' as any,
            data: {
              subject: `⚠️ Prestataire non réactif — ${booking.establishment.name}`,
              title: 'Prestataire non réactif',
              message: `La réservation ${booking.reference} pour ${booking.establishment.name} a expiré après 48h sans réponse. Prestataire à contacter : ${booking.establishment.phone || booking.establishment.email || 'N/A'}`,
            },
          }).catch(() => {});

          // AuditLog
          await logAudit({
            action: 'update',
            entityType: 'booking',
            entityId: booking.id,
            details: {
              action: 'booking_expired',
              reference: booking.reference,
              establishmentName: booking.establishment.name,
              hoursWaiting: Math.round(hoursWaiting),
              relanceCount: booking.relanceCount + 1,
            },
          });

          results.expired++;
          logger.info(`[BOOKING_RELANCE] ✗ EXPIRÉ: ${booking.reference} (${Math.round(hoursWaiting)}h) — ${booking.establishment.name}`);
          continue;
        }

        // =============================================
        // ÉTAPE 2 : Après 24h → Relance voyageur
        // =============================================
        if (hoursWaiting >= RELANCE_TRAVELER_HOURS && booking.relanceCount === 1) {
          // Envoyer un email d'excuse au voyageur avec alternatives
          if (booking.user.email) {
            await sendNotification({
              to: booking.user.email,
              type: 'booking_relance_traveler' as any,
              userId: booking.user.id,
              data: {
                reference: booking.reference,
                establishmentName: booking.establishment.name,
                checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                checkOut: booking.checkOut?.toLocaleDateString('fr-FR'),
                city: booking.establishment.city,
                establishmentType: booking.establishment.type,
                entityType: 'booking',
                entityId: booking.id,
              },
            }).catch(() => {});
          }

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              lastRelanceAt: now,
              relanceCount: { increment: 1 },
            },
          });

          // AuditLog
          await logAudit({
            action: 'update',
            entityType: 'booking',
            entityId: booking.id,
            details: {
              action: 'relance_traveler',
              reference: booking.reference,
              hoursWaiting: Math.round(hoursWaiting),
              travelerEmail: booking.user.email,
            },
          });

          results.relancesTraveler++;
          logger.info(`[BOOKING_RELANCE] → Relance VOYAGEUR: ${booking.reference} (${Math.round(hoursWaiting)}h)`);
          continue;
        }

        // =============================================
        // ÉTAPE 1 : Après 12h → Relance prestataire
        // =============================================
        if (hoursWaiting >= RELANCE_PROVIDER_HOURS && booking.relanceCount === 0) {
          // Trouver l'email du prestataire (owner de l'établissement)
          let providerEmail: string | null = null;
          if (booking.establishment.claimedByUserId) {
            const owner = await prisma.user.findUnique({
              where: { id: booking.establishment.claimedByUserId },
              select: { email: true, id: true },
            });
            providerEmail = owner?.email || null;
          }
          // Fallback : email de l'établissement
          if (!providerEmail) {
            providerEmail = booking.establishment.email || null;
          }

          if (providerEmail) {
            await sendNotification({
              to: providerEmail,
              type: 'booking_relance_provider' as any,
              userId: booking.establishment.claimedByUserId || undefined,
              data: {
                reference: booking.reference,
                establishmentName: booking.establishment.name,
                guestName: booking.guestName,
                checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                checkOut: booking.checkOut?.toLocaleDateString('fr-FR'),
                guestCount: booking.guestCount,
                waitingHours: Math.round(hoursWaiting),
                entityType: 'booking',
                entityId: booking.id,
              },
            }).catch(() => {});
          }

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              lastRelanceAt: now,
              relanceCount: { increment: 1 },
            },
          });

          // AuditLog
          await logAudit({
            action: 'update',
            entityType: 'booking',
            entityId: booking.id,
            details: {
              action: 'relance_provider',
              reference: booking.reference,
              hoursWaiting: Math.round(hoursWaiting),
              providerEmail: providerEmail || 'N/A',
            },
          });

          results.relancesProvider++;
          logger.info(`[BOOKING_RELANCE] → Relance PRESTATAIRE: ${booking.reference} (${Math.round(hoursWaiting)}h) — ${booking.establishment.name}`);
          continue;
        }
      } catch (err) {
        results.errors++;
        logger.error(`[BOOKING_RELANCE] Erreur pour ${booking.reference}:`, err);
      }
    }

    results.duration = Date.now() - startTime;
    logger.info(`[BOOKING_RELANCE] ✓ Terminé en ${results.duration}ms — ${results.relancesProvider} relances prestataire, ${results.relancesTraveler} relances voyageur, ${results.expired} expirations`);

    return NextResponse.json(results);
  } catch (error) {
    logger.error('[BOOKING_RELANCE] Erreur fatale:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la relance', duration: Date.now() - startTime },
      { status: 500 }
    );
  }
}
