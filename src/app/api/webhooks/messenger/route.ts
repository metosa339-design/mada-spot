// Facebook Messenger webhook endpoint
// Configure in Meta App Dashboard > Messenger > Settings > Webhooks
// Subscription fields: messages, messaging_postbacks, message_reads
import { NextRequest, NextResponse } from 'next/server';
import { VERIFY_TOKEN, fetchMessengerProfile, verifyMessengerSignature } from '@/lib/messenger';
import {
  appendConversationMessage,
  findOrCreateConversation,
  findOrCreateProspectByPsid,
  recordInboundFromProspect,
} from '@/lib/crm';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET — Vérification du webhook par Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST — Réception des événements Messenger
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyMessengerSignature(rawBody, signature)) {
    logger.warn('Messenger webhook: signature invalide');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad JSON', { status: 400 });
  }

  // Meta envoie object: 'page' avec un tableau d'entries
  if (payload?.object !== 'page') {
    return new NextResponse('Unsupported', { status: 200 });
  }

  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      try {
        await handleMessagingEvent(event);
      } catch (err) {
        logger.error('Messenger event handler failed', err);
      }
    }
  }

  // Meta exige une 200 rapide
  return new NextResponse('OK', { status: 200 });
}

async function handleMessagingEvent(event: any) {
  const senderPsid: string | undefined = event?.sender?.id;
  if (!senderPsid) return;

  // Ignorer nos propres messages echo (envoyés par la page)
  const isEcho = !!event?.message?.is_echo;
  if (isEcho) {
    // Optionnel : tracker les envois sortants vers Messenger comme livrés
    return;
  }

  // 1. Identifier le prospect
  let firstName: string | undefined;
  let lastName: string | undefined;
  let locale: string | undefined;
  try {
    const profile = await fetchMessengerProfile(senderPsid);
    if (profile) {
      firstName = profile.firstName;
      lastName = profile.lastName;
      locale = profile.locale;
    }
  } catch {
    // ignore profile fetch errors
  }

  const prospect = await findOrCreateProspectByPsid(senderPsid, { firstName, lastName, locale });

  // 2. Construire le contenu textuel
  let content = '';
  let attachments: any[] | undefined;
  if (event.message) {
    content = event.message.text || '';
    if (Array.isArray(event.message.attachments) && event.message.attachments.length) {
      const mapped = event.message.attachments.map((a: any) => ({
        type: a.type,
        url: a.payload?.url,
        title: a.payload?.title,
      }));
      attachments = mapped;
      if (!content) content = `[Pièce jointe ${mapped[0]?.type || ''}]`;
    }
  } else if (event.postback) {
    content = `[Postback] ${event.postback.title || event.postback.payload || ''}`;
  } else if (event.delivery || event.read) {
    // Marquer livré/lu côté de notre côté
    return;
  } else {
    return;
  }

  if (!content) return;

  const externalMessageId = event.message?.mid || null;

  // Idempotence : si on a déjà ce message, on n'écrit pas deux fois
  if (externalMessageId) {
    const existing = await prisma.conversationMessage.findUnique({
      where: { externalMessageId },
    });
    if (existing) return;
  }

  // 3. Trouver / créer la conversation
  const conv = await findOrCreateConversation({
    channel: 'MESSENGER',
    prospectId: prospect.id,
    externalThreadId: senderPsid, // 1:1 conversation = le PSID est le thread
  });

  // 4. Append message + update prospect
  await appendConversationMessage({
    conversationId: conv.id,
    direction: 'INBOUND',
    channel: 'MESSENGER',
    content,
    externalMessageId,
    attachments,
    isDelivered: true,
  });

  await recordInboundFromProspect(prospect.id);
}
