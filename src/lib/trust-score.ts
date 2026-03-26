// Trust Score: calculate reliability score (0-100) for establishments

import { prisma } from '@/lib/db'

interface TrustFactors {
  messageResponseRate: number    // 0-100 (30% weight)
  bookingAcceptanceRate: number  // 0-100 (30% weight)
  reviewResponseRate: number     // 0-100 (20% weight)
  physicalVerification: number   // 0 or 100 (10% weight)
  documentsVerified: number      // 0 or 100 (10% weight)
}

/**
 * Calculate trust score for an establishment
 */
export async function calculateTrustScore(establishmentId: string): Promise<{
  score: number
  factors: TrustFactors
}> {
  const establishment = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: {
      claimedByUserId: true,
      lastPhysicalVisit: true,
      reviews: {
        select: { ownerResponse: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!establishment) {
    return { score: 0, factors: { messageResponseRate: 0, bookingAcceptanceRate: 0, reviewResponseRate: 0, physicalVerification: 0, documentsVerified: 0 } }
  }

  // Factor 1: Message response rate (30%)
  let messageResponseRate = 0
  if (establishment.claimedByUserId) {
    const totalReceived = await prisma.message.count({
      where: { receiverId: establishment.claimedByUserId, establishmentId },
    })
    const totalReplied = await prisma.message.count({
      where: { senderId: establishment.claimedByUserId, establishmentId },
    })
    messageResponseRate = totalReceived > 0 ? Math.min(100, (totalReplied / totalReceived) * 100) : 50
  }

  // Factor 2: Booking acceptance rate (30%)
  let bookingAcceptanceRate = 50
  const totalBookings = await prisma.booking.count({
    where: { establishmentId },
  })
  if (totalBookings > 0) {
    const confirmedBookings = await prisma.booking.count({
      where: { establishmentId, status: { in: ['confirmed', 'completed'] } },
    })
    bookingAcceptanceRate = (confirmedBookings / totalBookings) * 100
  }

  // Factor 3: Review response rate (20%)
  let reviewResponseRate = 0
  if (establishment.reviews.length > 0) {
    const respondedCount = establishment.reviews.filter(r => r.ownerResponse).length
    reviewResponseRate = (respondedCount / establishment.reviews.length) * 100
  }

  // Factor 4: Physical verification (10%)
  const physicalVerification = establishment.lastPhysicalVisit ? 100 : 0

  // Factor 5: Documents verified (10%)
  let documentsVerified = 0
  if (establishment.claimedByUserId) {
    const verifiedDocs = await prisma.verificationDocument.count({
      where: { userId: establishment.claimedByUserId, status: 'VERIFIED' },
    })
    documentsVerified = verifiedDocs > 0 ? 100 : 0
  }

  const factors: TrustFactors = {
    messageResponseRate: Math.round(messageResponseRate),
    bookingAcceptanceRate: Math.round(bookingAcceptanceRate),
    reviewResponseRate: Math.round(reviewResponseRate),
    physicalVerification,
    documentsVerified,
  }

  const score = Math.round(
    factors.messageResponseRate * 0.3 +
    factors.bookingAcceptanceRate * 0.3 +
    factors.reviewResponseRate * 0.2 +
    factors.physicalVerification * 0.1 +
    factors.documentsVerified * 0.1
  )

  // Save to DB
  await prisma.establishment.update({
    where: { id: establishmentId },
    data: { trustScore: score, trustScoreUpdatedAt: new Date() },
  })

  return { score, factors }
}
