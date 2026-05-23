import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// GET /api/admin/crm/conversations/:id — détail + messages
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await ctx.params;

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
      prospect: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { authorAdmin: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });

  if (!conv) return apiError('Conversation introuvable', 404);

  // Marquer comme lue dès que l'admin l'ouvre
  if (conv.isUnread) {
    await prisma.conversation.update({ where: { id }, data: { isUnread: false } });
  }

  return apiSuccess(conv);
}

// PATCH /api/admin/crm/conversations/:id — changer status, assigné, marquer lu/non-lu
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);
  const { id } = await ctx.params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const allowed = ['status', 'assignedToId', 'isUnread', 'subject'];
  const data: any = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  const updated = await prisma.conversation.update({ where: { id }, data });
  return apiSuccess(updated);
}
