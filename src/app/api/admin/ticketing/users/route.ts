// Mada Spot — Admin billetterie : recherche d'utilisateurs et attribution de rôle.
// Débloque l'accès aux back-offices (ORGANIZER / AGENT / POS_VENDOR).

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { requireAdminSession, ensureCsrf } from '@/lib/ticketing/admin';

export const dynamic = 'force-dynamic';

const ASSIGNABLE_ROLES = ['CLIENT', 'ORGANIZER', 'AGENT', 'POS_VENDOR'] as const;

const setRoleSchema = z.object({
  csrfToken: z.string().optional(),
  userId: z.string().min(1),
  role: z.enum(ASSIGNABLE_ROLES),
});

// GET /api/admin/ticketing/users?q=
export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  try {
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : { role: { in: ['ORGANIZER', 'AGENT', 'POS_VENDOR'] } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    logger.error('GET admin/ticketing/users a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/admin/ticketing/users — attribution de rôle.
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const csrf = ensureCsrf(body);
  if (csrf) return csrf;

  const parsed = setRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, role: true },
    });
    if (!target) return apiError('Utilisateur introuvable', 404);
    // On ne rétrograde jamais un ADMIN via cet écran.
    if (target.role === 'ADMIN') return apiError('Impossible de modifier un administrateur ici', 409);

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    });

    // Un vendeur POS reçoit automatiquement un portefeuille de caisse.
    if (parsed.data.role === 'POS_VENDOR') {
      await prisma.posWallet.upsert({
        where: { vendorId: parsed.data.userId },
        create: { vendorId: parsed.data.userId },
        update: {},
      });
    }

    await logAudit({
      userId: auth.admin.id,
      action: 'TICKETING_SET_ROLE',
      entityType: 'User',
      entityId: parsed.data.userId,
      details: { role: parsed.data.role, previous: target.role },
      ...getRequestMeta(request),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('POST admin/ticketing/users a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
