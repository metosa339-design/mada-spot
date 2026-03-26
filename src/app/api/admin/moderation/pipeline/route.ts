import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/moderation/pipeline — pending establishments with owner verification docs
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const rawEstablishments = await prisma.establishment.findMany({
      where: { moderationStatus: 'pending_review' },
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
        phone: true,
        email: true,
        moderationStatus: true,
        moderationNote: true,
        dataSource: true,
        createdAt: true,
        createdByUserId: true,
        isClaimed: true,
        claimedByUserId: true,
      },
    });

    // Enrich with submitter info
    const userIds = new Set<string>();
    for (const est of rawEstablishments) {
      if (est.createdByUserId) userIds.add(est.createdByUserId);
      if (est.claimedByUserId) userIds.add(est.claimedByUserId);
    }

    const users = userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    // Fetch verification documents
    const documents = userIds.size > 0
      ? await prisma.verificationDocument.findMany({
          where: { userId: { in: Array.from(userIds) } },
          select: {
            id: true,
            userId: true,
            documentType: true,
            documentUrl: true,
            status: true,
            note: true,
          },
        })
      : [];

    const docsByUser = new Map<string, typeof documents>();
    for (const doc of documents) {
      if (!docsByUser.has(doc.userId)) docsByUser.set(doc.userId, []);
      docsByUser.get(doc.userId)!.push(doc);
    }

    const establishments = rawEstablishments.map(est => ({
      ...est,
      createdAt: est.createdAt.toISOString(),
      submitter: est.createdByUserId ? userMap.get(est.createdByUserId) || null
        : est.claimedByUserId ? userMap.get(est.claimedByUserId) || null
        : null,
      verificationDocuments: docsByUser.get(est.createdByUserId || '') || docsByUser.get(est.claimedByUserId || '') || [],
    }));

    return NextResponse.json({ success: true, establishments });
  } catch (err) {
    console.error('Pipeline error:', err);
    return apiError('Erreur serveur', 500);
  }
}
