import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { appendConversationMessage, recordOutboundContact } from '@/lib/crm';
import { sendMessengerMessage } from '@/lib/messenger';
import { sendNotification } from '@/lib/email';
import { logger } from '@/lib/logger';

// POST /api/admin/crm/conversations/:id/messages — envoyer un message OUTBOUND sur le canal de la conversation
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await ctx.params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const content = (body?.content || '').toString().trim();
  if (!content) return apiError('Contenu vide', 400);

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: { user: true, prospect: true },
  });
  if (!conv) return apiError('Conversation introuvable', 404);

  let delivered = false;
  let externalMessageId: string | null = null;
  let errorMessage: string | null = null;

  try {
    if (conv.channel === 'MESSENGER') {
      const psid = conv.prospect?.messengerPsid;
      if (!psid) {
        errorMessage = 'PSID Messenger manquant pour cette conversation';
      } else {
        const result = await sendMessengerMessage(psid, content);
        delivered = result.ok;
        externalMessageId = result.messageId || null;
        if (!result.ok) errorMessage = result.error || 'Échec envoi Messenger';
      }
    } else if (conv.channel === 'EMAIL') {
      const to = conv.user?.email || conv.prospect?.email;
      if (!to) {
        errorMessage = 'Adresse email manquante';
      } else {
        const ok = await sendNotification({
          to,
          type: 'message_new', // template générique d'email
          data: {
            preview: content,
            senderName: 'L\'équipe Mada Spot',
            establishmentName: null,
            url: '/contact',
            subject: conv.subject || '🇲🇬 Message de Mada Spot',
          },
          userId: conv.userId || undefined,
        });
        delivered = ok;
        if (!ok) errorMessage = 'Échec envoi email (SMTP non configuré ?)';
      }
    } else if (conv.channel === 'IN_APP') {
      // Pour IN_APP on s'appuie sur le système Message existant si la cible est un User
      if (conv.userId) {
        await prisma.message.create({
          data: {
            senderId: admin.id,
            receiverId: conv.userId,
            content,
          },
        });
        delivered = true;
      } else {
        errorMessage = 'IN_APP requiert un compte utilisateur';
      }
    } else {
      errorMessage = `Canal ${conv.channel} non encore supporté pour l'envoi sortant`;
    }
  } catch (err) {
    logger.error('CRM send failed', err);
    errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
  }

  const message = await appendConversationMessage({
    conversationId: id,
    direction: 'OUTBOUND',
    channel: conv.channel,
    content,
    externalMessageId,
    authorAdminId: admin.id,
    isDelivered: delivered,
    errorMessage,
  });

  if (delivered && conv.prospectId) {
    await recordOutboundContact(conv.prospectId);
  }

  return apiSuccess({ message, delivered, errorMessage });
}
