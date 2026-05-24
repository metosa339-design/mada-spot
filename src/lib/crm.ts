// CRM core helpers
import { prisma } from '@/lib/db';
import type {
  ConversationChannel,
  ConversationStatus,
  MessageDirection,
  Prospect,
  ProspectSource,
} from '@prisma/client';

/**
 * Find or create a Prospect by Messenger PSID.
 * Used by the Messenger webhook on inbound messages.
 */
export async function findOrCreateProspectByPsid(
  psid: string,
  enrich: { firstName?: string; lastName?: string; locale?: string } = {}
): Promise<Prospect> {
  const existing = await prisma.prospect.findUnique({ where: { messengerPsid: psid } });
  if (existing) {
    if ((!existing.firstName && enrich.firstName) || (!existing.lastName && enrich.lastName)) {
      return prisma.prospect.update({
        where: { id: existing.id },
        data: {
          firstName: existing.firstName || enrich.firstName || null,
          lastName: existing.lastName || enrich.lastName || null,
          locale: existing.locale || enrich.locale || null,
          facebookName: [enrich.firstName, enrich.lastName].filter(Boolean).join(' ') || existing.facebookName,
        },
      });
    }
    return existing;
  }

  return prisma.prospect.create({
    data: {
      messengerPsid: psid,
      firstName: enrich.firstName || null,
      lastName: enrich.lastName || null,
      locale: enrich.locale || null,
      facebookName: [enrich.firstName, enrich.lastName].filter(Boolean).join(' ') || null,
      source: 'MESSENGER' as ProspectSource,
      preferredChannel: 'MESSENGER',
      optInEmail: false,
    },
  });
}

interface OpenConversationParams {
  channel: ConversationChannel;
  userId?: string | null;
  prospectId?: string | null;
  externalThreadId?: string | null;
  subject?: string | null;
}

/**
 * Find an OPEN conversation for the given target+channel, or create one.
 * Conversations are not aggressively re-opened: if all are CLOSED we create a new one.
 */
export async function findOrCreateConversation(params: OpenConversationParams) {
  const { channel, userId, prospectId, externalThreadId, subject } = params;
  if (!userId && !prospectId) {
    throw new Error('findOrCreateConversation: userId ou prospectId requis');
  }

  // Prefer matching on the externalThreadId if provided
  if (externalThreadId) {
    const byThread = await prisma.conversation.findFirst({
      where: { externalThreadId, channel },
    });
    if (byThread) return byThread;
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      channel,
      ...(userId ? { userId } : {}),
      ...(prospectId ? { prospectId } : {}),
      status: { in: ['OPEN', 'PENDING', 'ON_HOLD'] as ConversationStatus[] },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      channel,
      userId: userId || null,
      prospectId: prospectId || null,
      externalThreadId: externalThreadId || null,
      subject: subject || null,
      status: 'OPEN',
      isUnread: true,
    },
  });
}

interface AppendMessageParams {
  conversationId: string;
  direction: MessageDirection;
  channel: ConversationChannel;
  content: string;
  externalMessageId?: string | null;
  authorAdminId?: string | null;
  isDelivered?: boolean;
  attachments?: unknown;
  errorMessage?: string | null;
}

/**
 * Append a message to a conversation and update the conversation summary.
 */
export async function appendConversationMessage(params: AppendMessageParams) {
  const {
    conversationId,
    direction,
    channel,
    content,
    externalMessageId,
    authorAdminId,
    isDelivered = false,
    attachments,
    errorMessage,
  } = params;

  const preview = content.slice(0, 280);

  const [message] = await prisma.$transaction([
    prisma.conversationMessage.create({
      data: {
        conversationId,
        direction,
        channel,
        content,
        externalMessageId: externalMessageId || null,
        authorAdminId: authorAdminId || null,
        isDelivered,
        deliveredAt: isDelivered ? new Date() : null,
        errorMessage: errorMessage || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: preview,
        // Inbound = unread for admins. Outbound = mark as read (we just sent it).
        isUnread: direction === 'INBOUND',
        // Re-open if we receive a new inbound message on a closed conv
        ...(direction === 'INBOUND' ? { status: 'OPEN' as ConversationStatus } : {}),
      },
    }),
  ]);

  return message;
}

/**
 * Increment Prospect counters when an outbound contact attempt happens.
 */
export async function recordOutboundContact(prospectId: string) {
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      lastContactedAt: new Date(),
      contactAttempts: { increment: 1 },
      status: 'CONTACTED',
    },
  });
}

/**
 * When a prospect actually responds, mark them as ENGAGED.
 */
export async function recordInboundFromProspect(prospectId: string) {
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      lastInboundAt: new Date(),
      status: 'ENGAGED',
    },
  });
}
