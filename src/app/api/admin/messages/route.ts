import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/messages — list conversations or messages for a thread
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');
  const search = searchParams.get('search') || '';

  try {
    if (threadId) {
      // Fetch messages for a specific conversation
      const [user1Id, user2Id, estId] = threadId.split(':');
      const establishmentId = estId === '__none__' ? null : estId;

      const whereClause: Record<string, unknown> = {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      };
      if (establishmentId) {
        whereClause.establishmentId = establishmentId;
      } else {
        whereClause.establishmentId = null;
      }

      const messages = await prisma.message.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: whereClause as any,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          isRead: true,
          createdAt: true,
          sender: { select: { id: true, firstName: true, lastName: true, email: true } },
          receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      return NextResponse.json({ success: true, messages });
    }

    // List recent conversations (aggregated)
    const recentMessages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        establishmentId: true,
        content: true,
        isRead: true,
        createdAt: true,
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
        establishment: { select: { id: true, name: true } },
      },
    });

    // Build threads
    const threadMap = new Map<string, {
      threadId: string;
      participants: { id: string; firstName: string | null; lastName: string | null; email: string }[];
      establishment: { id: string; name: string } | null;
      lastMessage: string;
      lastDate: string;
      unreadCount: number;
      messageCount: number;
    }>();

    for (const msg of recentMessages) {
      const ids = [msg.senderId, msg.receiverId].sort();
      const key = `${ids[0]}:${ids[1]}:${msg.establishmentId || '__none__'}`;

      if (!threadMap.has(key)) {
        threadMap.set(key, {
          threadId: key,
          participants: [
            { ...msg.sender, email: msg.sender.email || '' },
            { ...msg.receiver, email: msg.receiver.email || '' },
          ],
          establishment: msg.establishment,
          lastMessage: msg.content,
          lastDate: msg.createdAt.toISOString(),
          unreadCount: 0,
          messageCount: 0,
        });
      }
      const thread = threadMap.get(key)!;
      thread.messageCount++;
      if (!msg.isRead) thread.unreadCount++;
    }

    let threads = Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      threads = threads.filter(t =>
        t.participants.some(p =>
          `${p.firstName || ''} ${p.lastName || ''} ${p.email}`.toLowerCase().includes(q)
        ) || t.establishment?.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, threads: threads.slice(0, 50) });
  } catch (err) {
    console.error('Admin messages error:', err);
    return apiError('Erreur serveur', 500);
  }
}
