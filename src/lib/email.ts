import { logger } from '@/lib/logger';
// Email service with SMTP support
// Falls back to console logging if SMTP is not configured
// Configure: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env

/** Escape user-supplied strings for safe HTML interpolation */
function h(str: string | number | null | undefined): string {
  const s = String(str ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try to use the email API route
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        secret: process.env.EMAIL_SECRET,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.sent || data.queued || false;
    }
  } catch {
    // Fallback to console
  }

  // Fallback log — email sending failed silently
  return false;
}

// ============================================
// Notification types for the platform
// ============================================

type NotificationType =
  | 'reminder'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_new'
  | 'booking_relance_provider'
  | 'booking_relance_traveler'
  | 'booking_expired'
  | 'message_new'
  | 'review_new'
  | 'weather_alert'
  | 'loyalty_tier_upgrade';

const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.com';

const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;`;
const headerHtml = `<div style="background: linear-gradient(135deg, #ff6b35, #ff1493); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
  <h1 style="color: white; margin: 0; font-size: 22px;">Mada Spot</h1>
  <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Bons Plans à Madagascar</p>
</div>`;
const btnStyle = `display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ff6b35, #ff1493); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;`;
const bodyStyle = `background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;`;

function getNotificationTemplate(type: NotificationType, data: Record<string, any>): { subject: string; html: string } {
  switch (type) {
    case 'booking_new':
      return {
        subject: `Nouvelle réservation ${h(data.reference)} - ${h(data.establishmentName)}`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px;">Réservation enregistrée</h2>
          <p>Votre réservation a bien été enregistrée.</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Référence :</strong> <span style="color: #ff6b35; font-weight: 700;">${h(data.reference)}</span></p>
            <p style="margin: 4px 0;"><strong>Établissement :</strong> ${h(data.establishmentName)}</p>
            <p style="margin: 4px 0;"><strong>Date :</strong> ${h(data.checkIn)}${data.checkOut ? ` → ${h(data.checkOut)}` : ''}</p>
            <p style="margin: 4px 0;"><strong>Personnes :</strong> ${h(data.guestCount || 1)}</p>
            ${data.totalPrice ? `<p style="margin: 4px 0;"><strong>Prix :</strong> ${h(data.totalPrice)} ${h(data.currency || 'MGA')}</p>` : ''}
          </div>
          <p style="color: #64748b; font-size: 13px;">Statut : <strong>En attente de confirmation</strong></p>
          <a href="${SITE_BASE}/client/bookings" style="${btnStyle}">Voir mes réservations</a>
        </div></div>`,
      };
    case 'booking_confirmed':
      return {
        subject: `Réservation ${h(data.reference)} confirmée !`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px; color: #10b981;">Réservation confirmée !</h2>
          <p>Votre réservation chez <strong>${h(data.establishmentName)}</strong> a été confirmée.</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Référence :</strong> ${h(data.reference)}</p>
            <p style="margin: 4px 0;"><strong>Date :</strong> ${h(data.checkIn)}${data.checkOut ? ` → ${h(data.checkOut)}` : ''}</p>
            <p style="margin: 4px 0;"><strong>Personnes :</strong> ${h(data.guestCount || 1)}</p>
          </div>
          <a href="${SITE_BASE}/client/bookings" style="${btnStyle}">Voir mes réservations</a>
        </div></div>`,
      };
    case 'booking_cancelled':
      return {
        subject: `Réservation ${h(data.reference)} annulée`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px; color: #ef4444;">Réservation annulée</h2>
          <p>Votre réservation chez <strong>${h(data.establishmentName)}</strong> a été annulée.</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Référence :</strong> ${h(data.reference)}</p>
            ${data.reason ? `<p style="margin: 4px 0;"><strong>Raison :</strong> ${h(data.reason)}</p>` : ''}
          </div>
          <a href="${SITE_BASE}/client/bookings" style="${btnStyle}">Voir mes réservations</a>
        </div></div>`,
      };
    case 'message_new':
      return {
        subject: `🇲🇬 Nouveau message sur votre compte Mada Spot !`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px;">Vous avez un nouveau message</h2>
          <p><strong>${h(data.senderName)}</strong> vous a envoyé un message${data.establishmentName ? ` concernant <strong>${h(data.establishmentName)}</strong>` : ''} :</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #ff6b35;">
            <p style="margin: 0; color: #334155; font-style: italic;">"${h(data.preview)}"</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Répondez rapidement pour ne pas perdre cette opportunité.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${SITE_BASE}${data.url || '/dashboard/messagerie'}" style="${btnStyle}; font-size: 16px; padding: 16px 32px;">
              Répondre sur mon espace Mada Spot
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
            Cet email a été envoyé automatiquement. Ne répondez pas directement à ce message.
          </p>
        </div></div>`,
      };
    case 'review_new':
      return {
        subject: `Nouvel avis ${data.rating ? '★'.repeat(data.rating) : ''} pour ${h(data.establishmentName)}`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px;">Nouvel avis client</h2>
          <p>Un ${data.isVerified ? '<strong>avis vérifié</strong>' : 'avis'} a été publié pour <strong>${h(data.establishmentName)}</strong>.</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Note :</strong> ${'★'.repeat(data.rating || 0)}${'☆'.repeat(5 - (data.rating || 0))} (${h(data.rating)}/5)</p>
            <p style="margin: 4px 0;"><strong>Auteur :</strong> ${h(data.authorName || 'Anonyme')}</p>
            ${data.title ? `<p style="margin: 4px 0;"><strong>Titre :</strong> ${h(data.title)}</p>` : ''}
            <div style="margin-top: 8px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #ff6b35;">
              <p style="margin: 0; color: #334155; font-style: italic;">"${h(data.comment?.slice(0, 200))}${(data.comment?.length || 0) > 200 ? '...' : ''}"</p>
            </div>
          </div>
          <p style="color: #64748b; font-size: 13px;">Vous pouvez répondre à cet avis depuis votre tableau de bord.</p>
          <a href="${SITE_BASE}/dashboard/avis" style="${btnStyle}">Voir et répondre</a>
        </div></div>`,
      };
    case 'booking_completed':
      return {
        subject: `Séjour terminé — Comment était ${h(data.establishmentName)} ?`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px; color: #3b82f6;">Séjour terminé !</h2>
          <p>Votre réservation chez <strong>${h(data.establishmentName)}</strong> est maintenant terminée.</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Référence :</strong> ${h(data.reference)}</p>
            <p style="margin: 4px 0;"><strong>Date :</strong> ${h(data.checkIn)}${data.checkOut ? ` → ${h(data.checkOut)}` : ''}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Partagez votre expérience et aidez d'autres voyageurs !</p>
          <a href="${SITE_BASE}/client/bookings/${h(data.bookingId)}/review" style="${btnStyle}">Laisser un avis</a>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">Vous gagnez <strong>50 points fidélité</strong> en laissant un avis vérifié.</p>
        </div></div>`,
      };
    case 'weather_alert':
      return {
        subject: `⚠️ Alerte météo ${h(data.level)} — ${h(data.title)}`,
        html: `<div style="${baseStyle}">
          <div style="background: ${data.level === 'red' ? '#ef4444' : data.level === 'orange' ? '#f97316' : '#eab308'}; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Alerte Météo</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 14px; font-weight: 600;">${h(data.title)}</p>
          </div>
          <div style="${bodyStyle}">
            <div style="background: white; padding: 16px; border-radius: 12px; margin: 0 0 16px; border-left: 4px solid ${data.level === 'red' ? '#ef4444' : data.level === 'orange' ? '#f97316' : '#eab308'};">
              <p style="margin: 0; color: #334155;">${h(data.message)}</p>
            </div>
            ${data.regions ? `<p style="margin: 4px 0; color: #64748b; font-size: 13px;"><strong>Régions concernées :</strong> ${h(data.regions)}</p>` : ''}
            <p style="color: #64748b; font-size: 13px; margin-top: 12px;">Consultez les mises à jour sur Mada Spot.</p>
            <a href="${SITE_BASE}/bons-plans" style="${btnStyle}">Voir les bons plans</a>
          </div>
        </div>`,
      };
    case 'loyalty_tier_upgrade':
      return {
        subject: `🎉 Félicitations ! Vous passez au niveau ${h(data.tierName)}`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px; color: ${data.tierName === 'Or' ? '#f59e0b' : '#94a3b8'};">🎉 Niveau ${h(data.tierName)} atteint !</h2>
          <p>Félicitations <strong>${h(data.firstName)}</strong> ! Vous avez accumulé <strong>${h(data.points)} points</strong> et passez au niveau <strong>${h(data.tierName)}</strong>.</p>
          <div style="background: linear-gradient(135deg, ${data.tierName === 'Or' ? '#f59e0b, #d97706' : '#94a3b8, #64748b'}); color: white; padding: 20px; border-radius: 12px; margin: 16px 0; text-align: center;">
            <p style="font-size: 32px; margin: 0;">${data.tierName === 'Or' ? '🥇' : '🥈'}</p>
            <p style="font-size: 18px; font-weight: 700; margin: 8px 0 0;">Niveau ${h(data.tierName)}</p>
            <p style="font-size: 13px; margin: 4px 0 0; opacity: 0.9;">${h(data.points)} points</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Continuez à voyager et profitez de vos avantages exclusifs !</p>
          <a href="${SITE_BASE}/client/fidelite" style="${btnStyle}">Mon espace fidélité</a>
        </div></div>`,
      };

    // ============================================
    // Relance automatique des réservations
    // ============================================

    case 'booking_relance_provider':
      return {
        subject: `⚠️ Réservation en attente — ${h(data.establishmentName)}`,
        html: `<div style="${baseStyle}">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Action requise</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">Réservation en attente de réponse</p>
          </div>
          <div style="${bodyStyle}">
            <h2 style="margin: 0 0 12px; color: #f59e0b;">Une demande attend votre réponse</h2>
            <p>Un voyageur a fait une demande de réservation pour <strong>${h(data.establishmentName)}</strong> et attend votre confirmation.</p>
            <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 4px 0;"><strong>Référence :</strong> <span style="color: #ff6b35; font-weight: 700;">${h(data.reference)}</span></p>
              <p style="margin: 4px 0;"><strong>Client :</strong> ${h(data.guestName)}</p>
              <p style="margin: 4px 0;"><strong>Date :</strong> ${h(data.checkIn)}${data.checkOut ? ` → ${h(data.checkOut)}` : ''}</p>
              <p style="margin: 4px 0;"><strong>Personnes :</strong> ${h(data.guestCount || 1)}</p>
              <p style="margin: 4px 0;"><strong>En attente depuis :</strong> ${h(data.waitingHours)}h</p>
            </div>
            <p style="color: #ef4444; font-size: 13px; font-weight: 600;">
              Sans réponse de votre part, cette réservation sera automatiquement annulée après 48h.
            </p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${SITE_BASE}/dashboard/reservations" style="${btnStyle}; background: linear-gradient(135deg, #f59e0b, #d97706);">
                Répondre maintenant
              </a>
            </div>
          </div>
        </div>`,
      };

    case 'booking_relance_traveler':
      return {
        subject: `Mise à jour sur votre réservation ${h(data.reference)}`,
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px; color: #3b82f6;">Mise à jour de votre réservation</h2>
          <p>Nous sommes désolés, le prestataire de <strong>${h(data.establishmentName)}</strong> ne semble pas disponible pour le moment.</p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Référence :</strong> ${h(data.reference)}</p>
            <p style="margin: 4px 0;"><strong>Date demandée :</strong> ${h(data.checkIn)}${data.checkOut ? ` → ${h(data.checkOut)}` : ''}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">Ne vous inquiétez pas ! Voici d'autres établissements similaires à <strong>${h(data.city)}</strong> qui pourraient vous intéresser :</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${SITE_BASE}/bons-plans/${h(data.establishmentType === 'HOTEL' ? 'hotels' : data.establishmentType === 'RESTAURANT' ? 'restaurants' : 'attractions')}?city=${encodeURIComponent(data.city || '')}" style="${btnStyle}">
              Voir les alternatives
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; text-align: center;">
            Votre réservation reste en attente. Nous vous notifierons si le prestataire répond.
          </p>
        </div></div>`,
      };

    case 'booking_expired':
      return {
        subject: `Réservation ${h(data.reference)} expirée — ${h(data.establishmentName)}`,
        html: `<div style="${baseStyle}">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Réservation expirée</h1>
          </div>
          <div style="${bodyStyle}">
            <p>Votre réservation chez <strong>${h(data.establishmentName)}</strong> a expiré car le prestataire n'a pas répondu dans les délais.</p>
            <div style="background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 4px 0;"><strong>Référence :</strong> ${h(data.reference)}</p>
              <p style="margin: 4px 0;"><strong>Établissement :</strong> ${h(data.establishmentName)}</p>
              <p style="margin: 4px 0;"><strong>Date :</strong> ${h(data.checkIn)}${data.checkOut ? ` → ${h(data.checkOut)}` : ''}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;">Nous vous invitons à explorer d'autres options sur Mada Spot.</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${SITE_BASE}/bons-plans" style="${btnStyle}; background: linear-gradient(135deg, #ff6b35, #ff1493);">
                Découvrir d'autres bons plans
              </a>
            </div>
          </div>
        </div>`,
      };

    default:
      return {
        subject: data.subject || 'Notification Mada Spot',
        html: `<div style="${baseStyle}">${headerHtml}<div style="${bodyStyle}">
          <h2 style="margin: 0 0 12px;">${h(data.title || 'Notification')}</h2>
          <p>${h(data.message)}</p>
          ${data.url ? `<a href="${SITE_BASE}${h(data.url)}" style="${btnStyle}">Voir</a>` : ''}
        </div></div>`,
      };
  }
}

/**
 * Send platform notification (email + in-app)
 */
export async function sendNotification(opts: {
  to: string;
  type: NotificationType;
  data: Record<string, any>;
  userId?: string;
}): Promise<boolean> {
  const template = getNotificationTemplate(opts.type, opts.data);

  // 1. Create in-app notification if userId provided
  if (opts.userId) {
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.notification.create({
        data: {
          userId: opts.userId,
          type: opts.type.toUpperCase() as any,
          title: template.subject,
          message: opts.data.preview || opts.data.message || template.subject,
          entityType: opts.data.entityType,
          entityId: opts.data.entityId,
        },
      });
    } catch (e) {
      logger.error('Failed to create in-app notification:', e);
    }

    // 1b. Send push notification (best-effort, never fail the main operation)
    try {
      const { sendPushToUser } = await import('@/lib/push');
      await sendPushToUser(opts.userId, {
        title: template.subject,
        body: opts.data.preview || opts.data.message || template.subject,
        url: opts.data.url || (opts.data.entityType ? `/${opts.data.entityType}/${opts.data.entityId}` : '/'),
        tag: opts.type,
        threadId: opts.data.threadId || null,
      });
    } catch {
      // Push is best-effort, don't fail the main operation
    }
  }

  // 2. Send email
  return sendEmail({ to: opts.to, ...template });
}

// Notify admin when a ghost establishment is created by a voyageur
export async function sendGhostCreatedNotificationToAdmin(
  establishmentName: string,
  creatorName: string,
  city: string,
  category: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@madaspot.com';

  return sendEmail({
    to: adminEmail,
    subject: `Nouveau lieu communautaire : ${h(establishmentName)} (${h(city)})`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #6366f1); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Fiche communautaire</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Un voyageur a ajouté un nouveau lieu</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
          <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #7c3aed;">
            <p style="margin: 4px 0;"><strong>Lieu :</strong> ${h(establishmentName)}</p>
            <p style="margin: 4px 0;"><strong>Ville :</strong> ${h(city)}</p>
            <p style="margin: 4px 0;"><strong>Catégorie :</strong> ${h(category)}</p>
            <p style="margin: 4px 0;"><strong>Créé par :</strong> ${h(creatorName)}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Ce lieu est en attente de modération et n'est pas visible publiquement.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://madaspot.com'}/admin?tab=moderation"
             style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin-top: 12px;">
            Modérer ce lieu
          </a>
        </div>
      </div>
    `,
  });
}

// Notify admin when a new claim is submitted
export async function sendClaimNotificationToAdmin(
  establishmentName: string,
  claimantName: string,
  claimantEmail: string,
  claimantRole: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@madaspot.com';

  return sendEmail({
    to: adminEmail,
    subject: `Nouvelle revendication : ${h(establishmentName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b35, #ff1493); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Nouvelle revendication de fiche</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
          <p><strong>Établissement :</strong> ${h(establishmentName)}</p>
          <p><strong>Demandeur :</strong> ${h(claimantName)}</p>
          <p><strong>Email :</strong> ${h(claimantEmail)}</p>
          <p><strong>Rôle :</strong> ${h(claimantRole)}</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://madaspot.com'}/admin?tab=claims"
             style="display: inline-block; padding: 12px 24px; background: #ff6b35; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Voir la revendication
          </a>
        </div>
      </div>
    `,
  });
}

// Notify claimant when their claim is approved
export async function sendClaimApprovedEmail(
  claimantEmail: string,
  establishmentName: string
): Promise<boolean> {
  return sendEmail({
    to: claimantEmail,
    subject: `Votre revendication pour "${h(establishmentName)}" a été approuvée`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Revendication approuvée</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
          <p>Votre revendication pour <strong>${h(establishmentName)}</strong> a été approuvée.</p>
          <p>Vous pouvez maintenant gérer votre fiche et mettre à jour vos informations.</p>
        </div>
      </div>
    `,
  });
}

// Notify claimant when their claim is rejected
export async function sendClaimRejectedEmail(
  claimantEmail: string,
  establishmentName: string,
  reason?: string
): Promise<boolean> {
  return sendEmail({
    to: claimantEmail,
    subject: `Revendication pour "${h(establishmentName)}" - Mise à jour`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #64748b; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Revendication non approuvée</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
          <p>Votre revendication pour <strong>${h(establishmentName)}</strong> n'a pas pu être approuvée.</p>
          ${reason ? `<p><strong>Raison :</strong> ${h(reason)}</p>` : ''}
          <p>Si vous pensez qu'il s'agit d'une erreur, contactez-nous à support@madaspot.com.</p>
        </div>
      </div>
    `,
  });
}
