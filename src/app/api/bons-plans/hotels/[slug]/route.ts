import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
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

    const hotel = await prisma.establishment.findFirst({
      where: {
        slug,
        type: 'HOTEL',
        isActive: true,
        moderationStatus: 'approved',
      },
      include: {
        hotel: {
          include: {
            roomTypes: {
              where: { isAvailable: true },
              orderBy: { pricePerNight: 'asc' },
            },
          },
        },
        reviews: {
          where: { isPublished: true },
          select: { id: true, rating: true, title: true, comment: true, authorName: true, images: true, ownerResponse: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel non trouvé' }, { status: 404 });
    }

    // Increment view count + track view
    await Promise.all([
      prisma.establishment.update({
        where: { id: hotel.id },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.establishmentView.create({
        data: { establishmentId: hotel.id, source: detectViewSource(request) },
      }).catch(() => {}),
    ]);

    // Fetch owner info if claimed
    let owner = null;
    if (hotel.claimedByUserId) {
      const ownerUser = await prisma.user.findUnique({
        where: { id: hotel.claimedByUserId },
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

    // Get similar hotels in same city
    const similarHotels = await prisma.establishment.findMany({
      where: {
        type: 'HOTEL',
        city: hotel.city,
        isActive: true,
        id: { not: hotel.id },
      },
      include: {
        hotel: {
          include: {
            roomTypes: {
              where: { isAvailable: true },
              take: 1,
              orderBy: { pricePerNight: 'asc' },
            },
          },
        },
      },
      take: 4,
      orderBy: { rating: 'desc' },
    });

    return NextResponse.json({
      hotel: {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        description: hotel.description,
        shortDescription: hotel.shortDescription,
        address: hotel.address,
        city: hotel.city,
        district: hotel.district,
        region: hotel.region,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        phone: hotel.phone,
        phone2: hotel.phone2,
        email: hotel.email,
        website: hotel.website,
        facebook: hotel.facebook,
        instagram: hotel.instagram,
        whatsapp: hotel.whatsapp,
        coverImage: hotel.coverImage,
        images: safeJsonParse(hotel.images, []),
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        isFeatured: hotel.isFeatured,
        isPremium: hotel.isPremium,
        viewCount: hotel.viewCount,
        isClaimed: hotel.isClaimed,
        claimedByUserId: hotel.claimedByUserId,
        // Multilingual
        nameEn: hotel.nameEn,
        descriptionEn: hotel.descriptionEn,
        shortDescriptionEn: hotel.shortDescriptionEn,
        // Hotel specific
        starRating: hotel.hotel?.starRating,
        hotelType: hotel.hotel?.hotelType,
        amenities: safeJsonParse(hotel.hotel?.amenities, []),
        checkInTime: hotel.hotel?.checkInTime,
        checkOutTime: hotel.hotel?.checkOutTime,
        openingHours: safeJsonParse(hotel.hotel?.openingHours, null),
        // Room types
        roomTypes: hotel.hotel?.roomTypes.map((room) => ({
          id: room.id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          priceWeekend: room.priceWeekend,
          amenities: safeJsonParse(room.amenities, []),
          images: safeJsonParse(room.images, []),
        })) || [],
        // Reviews
        reviews: hotel.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          authorName: review.authorName,
          images: safeJsonParse(review.images, []),
          ownerResponse: review.ownerResponse,
          createdAt: review.createdAt,
        })),
        // Owner
        owner,
        // Import metadata
        dataSource: hotel.dataSource,
        sourceUrl: hotel.sourceUrl,
        sourceAttribution: hotel.sourceAttribution,
      },
      similarHotels: similarHotels.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        coverImage: h.coverImage,
        city: h.city,
        rating: h.rating,
        reviewCount: h.reviewCount,
        starRating: h.hotel?.starRating,
        lowestPrice: h.hotel?.roomTypes[0]?.pricePerNight,
      })),
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching hotel:', error);
    return apiError('Erreur serveur', 500);
  }
}
