import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { computeScore } from '@/lib/crm/scoring';

export const dynamic = 'force-dynamic';

interface TimelineItem {
  type: string;
  date: string;
  title: string;
  detail?: string;
}

// GET /api/admin/crm/contact?email=... — vue 360° d'un contact (user + prospect fusionnés)
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  if (!email) return apiError('email requis', 400);

  const [user, prospect] = await Promise.all([
    prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, userType: true, createdAt: true, isActive: true, isBanned: true },
    }),
    prisma.prospect.findFirst({
      where: { email },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true, company: true, city: true,
        status: true, source: true, score: true, contactAttempts: true,
        lastContactedAt: true, lastInboundAt: true, convertedAt: true, createdAt: true,
      },
    }),
  ]);

  if (!user && !prospect) return apiError('Aucun contact avec cet email', 404);

  const userIds = user ? [user.id] : [];
  const prospectIds = prospect ? [prospect.id] : [];

  // Conversations (par user OU prospect)
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
        ...(prospectIds.length ? [{ prospectId: { in: prospectIds } }] : []),
      ],
    },
    select: { id: true, channel: true, status: true, subject: true, lastMessageAt: true, lastMessagePreview: true, isUnread: true },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });

  // Éléments liés au compte user
  let bookings: any[] = [];
  let reviews: any[] = [];
  let notes: any[] = [];
  let followUps: any[] = [];
  let campaignSends: any[] = [];

  if (user) {
    [bookings, reviews] = await Promise.all([
      prisma.booking.findMany({ where: { userId: user.id }, select: { reference: true, status: true, checkIn: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.establishmentReview.findMany({ where: { userId: user.id }, select: { rating: true, comment: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
  }

  [notes, followUps] = await Promise.all([
    prisma.contactNote.findMany({
      where: { OR: [...(userIds.length ? [{ userId: { in: userIds } }] : []), ...(prospectIds.length ? [{ prospectId: { in: prospectIds } }] : [])] },
      orderBy: { createdAt: 'desc' }, take: 30,
    }),
    prisma.followUp.findMany({
      where: { OR: [...(userIds.length ? [{ userId: { in: userIds } }] : []), ...(prospectIds.length ? [{ prospectId: { in: prospectIds } }] : [])] },
      orderBy: { dueAt: 'desc' }, take: 30,
    }),
  ]);

  campaignSends = await prisma.campaignRecipient.findMany({
    where: { email, status: 'SENT' },
    select: { sentAt: true, campaignId: true },
    orderBy: { sentAt: 'desc' },
    take: 30,
  });

  // Timeline fusionnée
  const timeline: TimelineItem[] = [];
  const push = (type: string, date: Date | null, title: string, detail?: string) => {
    if (date) timeline.push({ type, date: date.toISOString(), title, detail });
  };

  if (user) push('account', user.createdAt, 'Compte créé', user.userType || undefined);
  if (prospect) push('prospect', prospect.createdAt, 'Prospect capturé', `source ${prospect.source}`);
  for (const c of conversations) push('conversation', c.lastMessageAt, `Message ${c.channel}`, c.lastMessagePreview || c.subject || undefined);
  for (const b of bookings) push('booking', b.createdAt, `Réservation ${b.reference}`, b.status);
  for (const r of reviews) push('review', r.createdAt, `Avis ${r.rating}★`, r.comment?.slice(0, 80));
  for (const n of notes) push('note', n.createdAt, 'Note interne', n.content?.slice(0, 80));
  for (const f of followUps) push('followup', f.dueAt, `Relance : ${f.title}`, f.status);
  for (const s of campaignSends) push('campaign', s.sentAt, 'E-mail de campagne envoyé');

  timeline.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Score en direct
  const liveScore = prospect
    ? computeScore({
        status: prospect.status,
        contactAttempts: prospect.contactAttempts,
        lastContactedAt: prospect.lastContactedAt,
        lastInboundAt: prospect.lastInboundAt,
        convertedAt: prospect.convertedAt,
        hasConversations: conversations.length > 0,
      })
    : user
      ? 100
      : 0;

  return apiSuccess({
    email,
    user,
    prospect,
    score: liveScore,
    counts: {
      conversations: conversations.length,
      bookings: bookings.length,
      reviews: reviews.length,
      notes: notes.length,
      followUps: followUps.length,
      campaignSends: campaignSends.length,
    },
    timeline: timeline.slice(0, 60),
  });
}
