import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/crm/ingest-email
// Verse un e-mail entrant dans le CRM (conversation + message INBOUND).
// Auth : secret partagé EMAIL_SECRET (comme /api/email/send) — permet à un outil IMAP de POSTer.
// body: { secret, from, fromName?, subject?, text, messageId?, receivedAt? }
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const expected = process.env.EMAIL_SECRET;
  if (expected && body?.secret !== expected) return apiError('Non autorisé', 401);

  const from = String(body?.from || '').trim().toLowerCase();
  const content = String(body?.text || '').trim();
  if (!from || !content) return apiError('from et text requis', 400);

  const subject = body?.subject ? String(body.subject).slice(0, 300) : null;
  const messageId = body?.messageId ? String(body.messageId) : null;
  const receivedAt = body?.receivedAt ? new Date(body.receivedAt) : new Date();

  // Anti-doublon si un messageId externe est fourni
  if (messageId) {
    const dup = await prisma.conversationMessage.findUnique({ where: { externalMessageId: messageId } }).catch(() => null);
    if (dup) return apiSuccess({ deduped: true, conversationId: dup.conversationId });
  }

  // Relier au contact (user OU prospect) par e-mail
  const [user, prospect] = await Promise.all([
    prisma.user.findFirst({ where: { email: from }, select: { id: true } }),
    prisma.prospect.findFirst({ where: { email: from }, select: { id: true, status: true } }),
  ]);

  // Trouver une conversation e-mail ouverte, sinon en créer une
  let conversation = await prisma.conversation.findFirst({
    where: {
      channel: 'EMAIL',
      status: { not: 'CLOSED' },
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(prospect ? [{ prospectId: prospect.id }] : []),
      ],
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId: user?.id || null,
        prospectId: !user && prospect ? prospect.id : null,
        channel: 'EMAIL',
        subject: subject || 'E-mail entrant',
        status: 'OPEN',
        isUnread: true,
        lastMessageAt: receivedAt,
        lastMessagePreview: content.slice(0, 140),
        externalThreadId: messageId || null,
      },
    });
  }

  await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      direction: 'INBOUND',
      channel: 'EMAIL',
      externalMessageId: messageId,
      content,
      isDelivered: true,
      deliveredAt: receivedAt,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { isUnread: true, status: 'OPEN', lastMessageAt: receivedAt, lastMessagePreview: content.slice(0, 140) },
  });

  // Le prospect a répondu → réchauffe le statut + horodate
  if (prospect) {
    const bump = prospect.status === 'NEW' || prospect.status === 'CONTACTED' ? { status: 'ENGAGED' as const } : {};
    await prisma.prospect.update({ where: { id: prospect.id }, data: { lastInboundAt: receivedAt, ...bump } });
  }

  return apiSuccess({ conversationId: conversation.id, linked: user ? 'user' : prospect ? 'prospect' : 'none' }, 201);
}
