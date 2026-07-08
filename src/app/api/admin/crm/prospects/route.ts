import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { nextRefCode } from '@/lib/crm/refcode';

// GET /api/admin/crm/prospects — liste des prospects avec filtres
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sourceFilter = searchParams.get('source') || 'all';
  const includeNewsletter = searchParams.get('includeNewsletter') === '1';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  const where: any = {};
  if (statusFilter !== 'all') where.status = statusFilter;
  if (sourceFilter !== 'all') where.source = sourceFilter;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { company: { contains: search, mode: 'insensitive' } },
      { facebookName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total, newsletterOrphans] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { conversations: true, notes: true, followUps: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.prospect.count({ where }),
    includeNewsletter
      ? prisma.newsletterSubscriber.findMany({
          where: {
            isActive: true,
            email: {
              notIn: (await prisma.prospect.findMany({ where: { email: { not: null } }, select: { email: true } })).map(
                p => p.email!
              ),
            },
          },
          orderBy: { subscribedAt: 'desc' },
          take: 200,
        })
      : Promise.resolve([]),
  ]);

  return apiSuccess({ items, total, limit, offset, newsletterOrphans });
}

// POST /api/admin/crm/prospects — créer un prospect
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const { email, phone, firstName, lastName, company, city, country, source, sourceNote, status } = body || {};
  if (!email && !phone) return apiError('email ou phone requis', 400);

  if (email) {
    const existing = await prisma.prospect.findUnique({ where: { email } });
    if (existing) return apiError('Un prospect avec cet email existe déjà', 409);
  }

  const refCode = await nextRefCode().catch(() => null);
  const prospect = await prisma.prospect.create({
    data: {
      email: email || null,
      phone: phone || null,
      firstName: firstName || null,
      lastName: lastName || null,
      company: company || null,
      city: city || null,
      country: country || null,
      source: source || 'MANUAL',
      sourceNote: sourceNote || null,
      status: status || 'NEW',
      ownerId: admin.id,
      refCode: refCode || undefined,
    },
  });

  const meta = getRequestMeta(request);
  await logAudit({
    userId: admin.id,
    action: 'create',
    entityType: 'prospect',
    entityId: prospect.id,
    details: { email, phone },
    ...meta,
  }).catch(() => {});

  return apiSuccess(prospect, 201);
}
