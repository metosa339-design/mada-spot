import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { sendNotification } from '@/lib/email';
import { NextResponse } from 'next/server';

// ============================================
// GET - List threads OR fetch messages for a thread
// ============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return apiError('Non authentifie', 401);

    const user = await verifySession(token);
    if (!user) return apiError('Session invalide', 401);

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    // ---- MODE 2: Fetch messages for a specific thread ----
    if (threadId) {
      // threadId format: "participantId:establishmentId" or "participantId:__none__"
      const [participantId, estId] = threadId.split(':');
      const establishmentId = estId === '__none__' ? null : estId;

      const whereClause: any = {
        OR: [
          { senderId: user.id, receiverId: participantId },
          { senderId: participantId, receiverId: user.id },
        ],
      };

      if (establishmentId) {
        whereClause.establishmentId = establishmentId;
      } else {
        whereClause.establishmentId = null;
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          senderId: true,
          content: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      });

      // Mark unread messages as read
      await prisma.message.updateMany({
        where: {
          receiverId: user.id,
          senderId: participantId,
          establishmentId: establishmentId || null,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });

      // Fetch partner presence (piggyback)
      const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
      const TYPING_EXPIRE_MS = 5 * 1000;
      let presence = null;
      try {
        const partnerPresence = await prisma.userPresence.findUnique({
          where: { userId: participantId },
          select: { isOnline: true, lastSeenAt: true, typingThreadId: true, typingAt: true },
        });
        if (partnerPresence) {
          const lastSeenMs = Date.now() - new Date(partnerPresence.lastSeenAt).getTime();
          const isTyping = partnerPresence.typingThreadId === threadId
            && partnerPresence.typingAt
            && (Date.now() - new Date(partnerPresence.typingAt).getTime()) < TYPING_EXPIRE_MS;
          presence = {
            online: lastSeenMs < ONLINE_THRESHOLD_MS,
            typing: !!isTyping,
            lastSeen: partnerPresence.lastSeenAt.toISOString(),
          };
        }
      } catch {
        // Presence fetch is best-effort
      }

      return NextResponse.json({
        success: true,
        messages: messages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          isRead: m.isRead,
          readAt: m.readAt?.toISOString() || null,
          createdAt: m.createdAt.toISOString(),
        })),
        presence,
      });
    }

    // ---- MODE 1: List all threads ----
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        establishment: {
          select: { id: true, name: true, coverImage: true },
        },
      },
    });

    // Group by thread (participantId:establishmentId)
    const threadMap = new Map<string, {
      id: string;
      participantId: string;
      participantName: string;
      participantAvatar: string | null;
      establishmentId: string | null;
      establishmentName: string | null;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }>();

    for (const msg of allMessages) {
      const isMe = msg.senderId === user.id;
      const other = isMe ? msg.receiver : msg.sender;
      const estKey = msg.establishmentId || '__none__';
      const threadKey = `${other.id}:${estKey}`;

      const existing = threadMap.get(threadKey);
      if (!existing) {
        threadMap.set(threadKey, {
          id: threadKey,
          participantId: other.id,
          participantName: `${other.firstName} ${other.lastName}`,
          participantAvatar: other.avatar,
          establishmentId: msg.establishmentId,
          establishmentName: msg.establishment?.name || null,
          lastMessage: msg.content.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content,
          lastMessageAt: msg.createdAt.toISOString(),
          unreadCount: !isMe && !msg.isRead ? 1 : 0,
        });
      } else {
        if (!isMe && !msg.isRead) {
          existing.unreadCount += 1;
        }
      }
    }

    const threads = Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({ success: true, threads });
  } catch (error) {
    logger.error('Erreur recuperation messages:', error);
    return apiError('Erreur serveur', 500);
  }
}

// ============================================
// POST - Send a new message (by threadId OR receiverId)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return apiError('Non authentifie', 401);

    const user = await verifySession(token);
    if (!user) return apiError('Session invalide', 401);

    const body = await request.json().catch(() => null);
    if (!body) return apiError('Corps de requete JSON invalide', 400);

    let { receiverId, content, establishmentId, threadId } = body;

    // If threadId is provided, extract receiverId and establishmentId
    if (threadId && !receiverId) {
      const [pId, estId] = threadId.split(':');
      receiverId = pId;
      establishmentId = estId === '__none__' ? null : estId;
    }

    if (!receiverId || typeof receiverId !== 'string') {
      return apiError('receiverId est requis', 400);
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return apiError('content est requis', 400);
    }

    if (receiverId === user.id) {
      return apiError("Impossible d'envoyer un message a soi-meme", 400);
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, email: true, firstName: true, lastName: true, userType: true },
    });

    if (!receiver) return apiError('Destinataire introuvable', 404);

    if (establishmentId) {
      const est = await prisma.establishment.findUnique({
        where: { id: establishmentId },
        select: { id: true },
      });
      if (!est) return apiError('Etablissement introuvable', 404);
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content: content.trim(),
        establishmentId: establishmentId || null,
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        isRead: true,
        createdAt: true,
        establishment: { select: { id: true, name: true } },
      },
    });

    // Anti-contournement: scan message for contact info (fire-and-forget)
    try {
      const { scanMessage } = await import('@/lib/message-scanner');
      const matches = scanMessage(content.trim());
      if (matches.length > 0) {
        for (const match of matches) {
          prisma.messageScanAlert.create({
            data: {
              messageId: message.id,
              senderId: user.id,
              receiverId,
              content: content.trim(),
              matchType: match.type,
              matchValue: match.value,
            },
          }).catch(() => {});
        }
      }
    } catch { /* scan is best-effort */ }

    // Auto-email notification (fire-and-forget)
    if (receiver.email) {
      const preview = content.trim().length > 120 ? content.trim().slice(0, 120) + '...' : content.trim();
      const estKey = (establishmentId || null) || '__none__';
      sendNotification({
        to: receiver.email,
        type: 'message_new',
        data: {
          senderName: `${user.firstName} ${user.lastName}`,
          establishmentName: message.establishment?.name || null,
          preview,
          entityType: 'message',
          entityId: message.id,
          url: receiver.userType ? '/dashboard/messagerie' : '/client/messagerie',
          threadId: `${user.id}:${estKey}`,
        },
        userId: receiverId,
      }).catch(() => {});
    }

    // Clear sender's typing indicator
    prisma.userPresence.update({
      where: { userId: user.id },
      data: { typingThreadId: null, typingAt: null },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('Erreur envoi message:', error);
    return apiError('Erreur serveur', 500);
  }
}
