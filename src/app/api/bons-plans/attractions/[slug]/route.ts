import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';

import { logger } from '@/lib/logger';
import { detectViewSource } from '@/lib/utils/detect-view-source';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const establishment = await prisma.establishment.findFirst({
      where: {
        slug,
        type: 'ATTRACTION',
        isActive: true,
        moderationStatus: 'approved',
      },
      include: {
        attraction: true,
        reviews: {
          where: { isPublished: true },
          select: { id: true, authorName: true, rating: true, title: true, comment: true, createdAt: true, ownerResponse: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!establishment || !establishment.attraction) {
      return NextResponse.json(
        { error: 'Attraction non trouvée' },
        { status: 404 }
      );
    }

    // Incrémenter le compteur de vues + track view
    await Promise.all([
      prisma.establishment.update({
        where: { id: establishment.id },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.establishmentView.create({
        data: { establishmentId: establishment.id, source: detectViewSource(request) },
      }).catch(() => {}),
    ]);

    // Fetch owner info if claimed
    let owner = null;
    if (establishment.claimedByUserId) {
      const ownerUser = await prisma.user.findUnique({
        where: { id: establishment.claimedByUserId },
        select: { firstName: true, lastName: true, avatar: true, createdAt: true },
      });
      if (ownerUser) {
        owner = {
          firstName: ownerUser.firstName || '',
          lastName: ownerUser.lastName || '',
          avatar: ownerUser.avatar,
          memberSince: ownerUser.createdAt.toISOString(),
        };
      }
    }

    // Trouver des attractions similaires
    const similarAttractions = await prisma.establishment.findMany({
      where: {
        type: 'ATTRACTION',
        isActive: true,
        id: { not: establishment.id },
        OR: [
          { city: establishment.city },
          { region: establishment.region },
          {
            attraction: {
              attractionType: establishment.attraction.attractionType,
            },
          },
        ],
      },
      include: {
        attraction: true,
      },
      take: 3,
      orderBy: { rating: 'desc' },
    });

    const transformedAttraction = {
      id: establishment.id,
      name: establishment.name,
      slug: establishment.slug,
      description: establishment.description,
      shortDescription: establishment.shortDescription,
      city: establishment.city,
      district: establishment.district,
      region: establishment.region,
      address: establishment.address,
      coverImage: establishment.coverImage,
      images: safeJsonParse(establishment.images, []),
      gallery: safeJsonParse(establishment.gallery, []),
      rating: establishment.rating,
      reviewCount: establishment.reviewCount,
      isFeatured: establishment.isFeatured,
      latitude: establishment.latitude,
      longitude: establishment.longitude,
      phone: establishment.phone,
      email: establishment.email,
      website: establishment.website,
      facebook: establishment.facebook,
      instagram: establishment.instagram,
      whatsapp: establishment.whatsapp,
      isClaimed: establishment.isClaimed,
      claimedByUserId: establishment.claimedByUserId,
      // Multilingual
      nameEn: establishment.nameEn,
      descriptionEn: establishment.descriptionEn,
      shortDescriptionEn: establishment.shortDescriptionEn,
      // Attraction specific
      attractionType: establishment.attraction.attractionType,
      isFree: establishment.attraction.isFree,
      entryFeeForeign: establishment.attraction.entryFeeForeign,
      entryFeeLocal: establishment.attraction.entryFeeLocal,
      visitDuration: establishment.attraction.visitDuration,
      bestTimeToVisit: establishment.attraction.bestTimeToVisit,
      isAccessible: establishment.attraction.isAccessible,
      hasGuide: establishment.attraction.hasGuide,
      hasParking: establishment.attraction.hasParking,
      openingHours: safeJsonParse(establishment.attraction.openingHours, null),
      isAvailable: establishment.attraction.isAvailable,
      highlights: safeJsonParse(establishment.attraction.highlights, []),
      reviews: establishment.reviews.map((r: any) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        ownerResponse: r.ownerResponse,
        images: safeJsonParse(r.images, []),
      })),
      // Owner
      owner,
      // Import metadata
      dataSource: establishment.dataSource,
      sourceUrl: establishment.sourceUrl,
      sourceAttribution: establishment.sourceAttribution,
    };

    const transformedSimilar = similarAttractions.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      city: a.city,
      coverImage: a.coverImage,
      rating: a.rating,
      attractionType: a.attraction?.attractionType,
      isFree: a.attraction?.isFree,
      entryFeeLocal: a.attraction?.entryFeeLocal,
    }));

    return NextResponse.json({
      attraction: transformedAttraction,
      similarAttractions: transformedSimilar,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching attraction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
