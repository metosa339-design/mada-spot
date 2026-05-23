import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const now = new Date();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    activeClients,
    totalProspects,
    newProspects7d,
    newsletterSubs,
    openConversations,
    unreadConversations,
    overdueFollowUps,
    conversationsByChannel,
    prospectsByStatus,
    prospectsBySource,
    newClients30d,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'CLIENT', isActive: true, isBanned: false } }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { createdAt: { gte: last7d } } }),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    prisma.conversation.count({ where: { status: { in: ['OPEN', 'PENDING'] } } }),
    prisma.conversation.count({ where: { isUnread: true } }),
    prisma.followUp.count({ where: { status: 'PENDING', dueAt: { lt: now } } }),
    prisma.conversation.groupBy({ by: ['channel'], _count: true }),
    prisma.prospect.groupBy({ by: ['status'], _count: true }),
    prisma.prospect.groupBy({ by: ['source'], _count: true }),
    prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: last30d } } }),
  ]);

  return apiSuccess({
    totals: {
      clients: totalClients,
      activeClients,
      newClients30d,
      prospects: totalProspects,
      newProspects7d,
      newsletterSubs,
      openConversations,
      unreadConversations,
      overdueFollowUps,
    },
    conversationsByChannel: conversationsByChannel.map(c => ({ channel: c.channel, count: c._count })),
    prospectsByStatus: prospectsByStatus.map(p => ({ status: p.status, count: p._count })),
    prospectsBySource: prospectsBySource.map(p => ({ source: p.source, count: p._count })),
  });
}
