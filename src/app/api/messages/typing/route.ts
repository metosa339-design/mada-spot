import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non authentifié', 401);

    const user = await verifySession(token);
    if (!user) return apiError('Session invalide', 401);

    const body = await request.json().catch(() => null);
    if (!body) return apiError('Corps JSON invalide', 400);

    const { threadId, isTyping } = body;

    await prisma.userPresence.upsert({
      where: { userId: user.id },
      update: {
        isOnline: true,
        lastSeenAt: new Date(),
        typingThreadId: isTyping ? (threadId || null) : null,
        typingAt: isTyping ? new Date() : null,
      },
      create: {
        userId: user.id,
        isOnline: true,
        lastSeenAt: new Date(),
        typingThreadId: isTyping ? (threadId || null) : null,
        typingAt: isTyping ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return apiError('Erreur serveur', 500);
  }
}
