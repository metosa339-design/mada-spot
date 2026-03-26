import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { apiError } from '@/lib/api-response';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const TYPING_EXPIRE_MS = 5 * 1000; // 5 seconds

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non authentifié', 401);

    const user = await verifySession(token);
    if (!user) return apiError('Session invalide', 401);

    const body = await request.json().catch(() => ({}));
    const { partnerId, threadId } = body;

    // Upsert current user's presence (heartbeat)
    await prisma.userPresence.upsert({
      where: { userId: user.id },
      update: { isOnline: true, lastSeenAt: new Date() },
      create: { userId: user.id, isOnline: true, lastSeenAt: new Date() },
    });

    // If partnerId provided, return partner's presence
    let partnerOnline = false;
    let partnerTyping = false;
    let partnerLastSeen: string | null = null;

    if (partnerId) {
      const presence = await prisma.userPresence.findUnique({
        where: { userId: partnerId },
        select: { isOnline: true, lastSeenAt: true, typingThreadId: true, typingAt: true },
      });

      if (presence) {
        const lastSeenMs = Date.now() - new Date(presence.lastSeenAt).getTime();
        partnerOnline = lastSeenMs < ONLINE_THRESHOLD_MS;
        partnerLastSeen = presence.lastSeenAt.toISOString();

        if (threadId && presence.typingThreadId === threadId && presence.typingAt) {
          const typingMs = Date.now() - new Date(presence.typingAt).getTime();
          partnerTyping = typingMs < TYPING_EXPIRE_MS;
        }
      }
    }

    return NextResponse.json({
      success: true,
      partner: {
        online: partnerOnline,
        typing: partnerTyping,
        lastSeen: partnerLastSeen,
      },
    });
  } catch {
    return apiError('Erreur serveur', 500);
  }
}
