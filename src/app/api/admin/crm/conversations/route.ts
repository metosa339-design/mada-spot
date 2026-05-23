import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { findOrCreateConversation } from '@/lib/crm';

// GET /api/admin/crm/conversations — boîte de réception unifiée
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') || 'all';
  const status = searchParams.get('status') || 'all';
  const unreadOnly = searchParams.get('unread') === '1';
  const search = searchParams.get('search')?.trim() || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  const where: any = {};
  if (channel !== 'all') where.channel = channel;
  if (status !== 'all') where.status = status;
  if (unreadOnly) where.isUnread = true;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { lastMessagePreview: { contains: search, mode: 'insensitive' } },
      { user: { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ] } },
      { prospect: { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { facebookName: { contains: search, mode: 'insensitive' } },
      ] } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        prospect: { select: { id: true, firstName: true, lastName: true, email: true, facebookName: true, status: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return apiSuccess({ items, total, limit, offset });
}

// POST /api/admin/crm/conversations — créer (ou ouvrir) une conversation
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const { userId, prospectId, channel, subject } = body || {};
  if (!channel) return apiError('channel requis', 400);
  if (!userId && !prospectId) return apiError('userId ou prospectId requis', 400);

  const conv = await findOrCreateConversation({ channel, userId, prospectId, subject });
  return apiSuccess(conv, 201);
}
