import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { keepId, removeId } = await request.json()
  if (!keepId || !removeId) return apiError('keepId et removeId requis')
  if (keepId === removeId) return apiError('Les deux IDs sont identiques')

  // Verify both exist
  const [keep, remove] = await Promise.all([
    prisma.establishment.findUnique({ where: { id: keepId }, select: { id: true, name: true } }),
    prisma.establishment.findUnique({ where: { id: removeId }, select: { id: true, name: true } }),
  ])
  if (!keep) return apiError('Établissement principal non trouvé', 404)
  if (!remove) return apiError('Établissement à supprimer non trouvé', 404)

  // Transfer relations
  await prisma.booking.updateMany({ where: { establishmentId: removeId }, data: { establishmentId: keepId } })
  await prisma.establishmentReview.updateMany({ where: { establishmentId: removeId }, data: { establishmentId: keepId } })
  await prisma.message.updateMany({ where: { establishmentId: removeId }, data: { establishmentId: keepId } })
  await prisma.establishmentView.updateMany({ where: { establishmentId: removeId }, data: { establishmentId: keepId } })
  await prisma.outboundClick.updateMany({ where: { establishmentId: removeId }, data: { establishmentId: keepId } })

  // Handle favorites (may have unique constraint conflicts)
  const removeFavs = await prisma.establishmentFavorite.findMany({ where: { establishmentId: removeId } })
  for (const fav of removeFavs) {
    const existing = await prisma.establishmentFavorite.findFirst({
      where: { userId: fav.userId, establishmentId: keepId },
    })
    if (!existing) {
      await prisma.establishmentFavorite.update({ where: { id: fav.id }, data: { establishmentId: keepId } })
    } else {
      await prisma.establishmentFavorite.delete({ where: { id: fav.id } })
    }
  }

  // Archive the removed establishment
  await prisma.establishment.update({
    where: { id: removeId },
    data: { archivedAt: new Date(), isActive: false },
  })

  // Update review/view counts on kept establishment
  const [reviewCount, reviewAvg] = await Promise.all([
    prisma.establishmentReview.count({ where: { establishmentId: keepId, isPublished: true } }),
    prisma.establishmentReview.aggregate({ where: { establishmentId: keepId, isPublished: true }, _avg: { rating: true } }),
  ])
  await prisma.establishment.update({
    where: { id: keepId },
    data: { reviewCount, rating: reviewAvg._avg.rating || 0 },
  })

  await logAudit({
    userId: admin.id,
    action: 'duplicate_merge',
    entityType: 'establishment',
    entityId: keepId,
    details: { keepId, keepName: keep.name, removeId, removeName: remove.name },
    ...getRequestMeta(request),
  })

  return NextResponse.json({ success: true, kept: keepId, archived: removeId })
}
