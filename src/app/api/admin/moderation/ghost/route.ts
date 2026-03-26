import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/moderation/ghost — list ghost establishments
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const rawGhosts = await prisma.establishment.findMany({
      where: { isGhost: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        city: true,
        district: true,
        region: true,
        coverImage: true,
        viewCount: true,
        rating: true,
        createdAt: true,
        createdByUserId: true,
        _count: {
          select: { reviews: true, views: true, messages: true },
        },
      },
    });

    // Enrich with creator info
    const creatorIds = rawGhosts
      .filter(g => g.createdByUserId)
      .map(g => g.createdByUserId!);

    const creators = creatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const creatorMap = new Map(creators.map(u => [u.id, u]));

    const ghosts = rawGhosts.map(g => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      type: g.type,
      city: g.city,
      district: g.district,
      region: g.region,
      coverImage: g.coverImage,
      viewCount: g.viewCount,
      rating: g.rating,
      createdAt: g.createdAt.toISOString(),
      submitter: g.createdByUserId ? creatorMap.get(g.createdByUserId) || null : null,
      reviewCount: g._count.reviews,
      viewsCount: g._count.views,
      messageCount: g._count.messages,
    }));

    return NextResponse.json({ success: true, ghosts });
  } catch (err) {
    console.error('Ghost list error:', err);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/admin/moderation/ghost — merge or promote ghost
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  try {
    const body = await request.json();
    const { action, ghostId, targetId } = body;

    if (!ghostId) return apiError('ghostId requis', 400);

    const ghost = await prisma.establishment.findUnique({
      where: { id: ghostId },
      select: { id: true, name: true, isGhost: true },
    });
    if (!ghost || !ghost.isGhost) return apiError('Lieu fantome introuvable', 404);

    if (action === 'promote') {
      await prisma.establishment.update({
        where: { id: ghostId },
        data: { isGhost: false, moderationStatus: 'approved' },
      });

      await prisma.auditLog.create({
        data: {
          action: 'ghost_promote',
          entityType: 'establishment',
          entityId: ghostId,
          userId: admin.id || null,
          details: `Promoted ghost "${ghost.name}" to real establishment`,
        },
      });

      return NextResponse.json({ success: true, message: 'Lieu promu en etablissement reel' });
    }

    if (action === 'merge') {
      if (!targetId) return apiError('targetId requis pour la fusion', 400);

      const target = await prisma.establishment.findUnique({ where: { id: targetId } });
      if (!target) return apiError('Etablissement cible introuvable', 404);

      // Transfer reviews, views, messages from ghost to target
      await prisma.establishmentReview.updateMany({
        where: { establishmentId: ghostId },
        data: { establishmentId: targetId },
      });
      await prisma.establishmentView.updateMany({
        where: { establishmentId: ghostId },
        data: { establishmentId: targetId },
      });
      await prisma.message.updateMany({
        where: { establishmentId: ghostId },
        data: { establishmentId: targetId },
      });

      // Delete the ghost
      await prisma.establishment.delete({ where: { id: ghostId } });

      await prisma.auditLog.create({
        data: {
          action: 'ghost_merge',
          entityType: 'establishment',
          entityId: targetId,
          userId: admin.id || null,
          details: `Merged ghost "${ghost.name}" into "${target.name}"`,
        },
      });

      return NextResponse.json({ success: true, message: `Fusion reussie vers ${target.name}` });
    }

    return apiError('Action non reconnue (promote|merge)', 400);
  } catch (err) {
    console.error('Ghost action error:', err);
    return apiError('Erreur serveur', 500);
  }
}
