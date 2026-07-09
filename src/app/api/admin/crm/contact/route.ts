import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { computeScore } from '@/lib/crm/scoring';
import { ensureUserRefCode, ensureProspectRefCode } from '@/lib/crm/refcode';
import { evaluateFiche } from '@/lib/crm/conformity';

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
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, userType: true, createdAt: true, isActive: true, isBanned: true, refCode: true },
    }),
    prisma.prospect.findFirst({
      where: { email },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true, company: true, city: true,
        status: true, source: true, score: true, contactAttempts: true,
        lastContactedAt: true, lastInboundAt: true, convertedAt: true, createdAt: true, refCode: true,
      },
    }),
  ]);

  if (!user && !prospect) return apiError('Aucun contact avec cet email', 404);

  // Assigne un ID lisible à la volée si absent
  let refCode: string | null = user?.refCode || prospect?.refCode || null;
  if (!refCode) {
    if (user) refCode = await ensureUserRefCode(user.id, null).catch(() => null);
    else if (prospect) refCode = await ensureProspectRefCode(prospect.id, null).catch(() => null);
  }

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

  // Éléments liés au compte user (centré établissement)
  let establishments: any[] = [];
  let bookings: any[] = [];
  let reviews: any[] = []; // avis REÇUS sur ses fiches
  let notes: any[] = [];
  let followUps: any[] = [];
  let campaignSends: any[] = [];
  const verification = { verified: 0, pending: 0, rejected: 0 };
  let boosts: any[] = [];

  if (user) {
    const est = await prisma.establishment.findMany({
      where: { OR: [{ claimedByUserId: user.id }, { createdByUserId: user.id }] },
      select: {
        id: true, name: true, type: true, slug: true, city: true, address: true, description: true,
        latitude: true, longitude: true, phone: true, email: true, website: true, coverImage: true, images: true,
        moderationStatus: true, isActive: true, isFeatured: true, isPremium: true, rating: true, reviewCount: true, trustScore: true,
      },
    });
    const estIds = est.map((e) => e.id);
    establishments = est.map((e) => {
      const conf = evaluateFiche(e);
      let imgs: string[] = [];
      try { const a = JSON.parse(e.images || '[]'); if (Array.isArray(a)) imgs = a; } catch { /* ignore */ }
      return {
        id: e.id, name: e.name, type: e.type, slug: e.slug, city: e.city,
        coverImage: e.coverImage, images: imgs,
        moderationStatus: e.moderationStatus, isActive: e.isActive, isFeatured: e.isFeatured, isPremium: e.isPremium,
        rating: e.rating, reviewCount: e.reviewCount, trustScore: e.trustScore,
        phone: e.phone, email: e.email, website: e.website,
        conformity: { score: conf.score, conforme: conf.conforme, failing: conf.failing.map((f) => ({ key: f.key, label: f.label })) },
      };
    });

    const [bk, rv, vdocs, bst] = await Promise.all([
      estIds.length ? prisma.booking.findMany({ where: { establishmentId: { in: estIds } }, select: { reference: true, status: true, checkIn: true, guestName: true, totalPrice: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }) : Promise.resolve([]),
      estIds.length ? prisma.establishmentReview.findMany({ where: { establishmentId: { in: estIds }, isPublished: true }, select: { rating: true, comment: true, authorName: true, ownerResponse: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }) : Promise.resolve([]),
      prisma.verificationDocument.groupBy({ by: ['status'], where: { userId: user.id }, _count: { _all: true } }),
      estIds.length ? prisma.boost.findMany({ where: { establishmentId: { in: estIds }, status: 'ACTIVE' }, select: { type: true, endDate: true }, orderBy: { endDate: 'desc' } }) : Promise.resolve([]),
    ]);
    bookings = bk;
    reviews = rv;
    boosts = bst;
    for (const v of vdocs) {
      if (v.status === 'VERIFIED') verification.verified = v._count._all;
      else if (v.status === 'PENDING') verification.pending = v._count._all;
      else if (v.status === 'REJECTED') verification.rejected = v._count._all;
    }
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
  for (const r of reviews) push('review', r.createdAt, `Avis reçu ${r.rating}★`, r.comment?.slice(0, 80));
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
    refCode,
    user,
    prospect,
    score: liveScore,
    establishments,
    reviewsList: reviews,
    bookingsList: bookings,
    verification,
    boosts,
    notesList: notes,
    followUpsList: followUps,
    counts: {
      establishments: establishments.length,
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
