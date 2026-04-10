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

    // Run all secondary queries in parallel (non-blocking)
    const [owner, similarHotels] = await Promise.all([
      // Fetch owner
      hotel.claimedByUserId
        ? prisma.user.findUnique({
            where: { id: hotel.claimedByUserId },
            select: { firstName: true, lastName: true, avatar: true, createdAt: true },
          })
        : null,
      // Similar hotels
      prisma.establishment.findMany({
        where: {
          type: 'HOTEL',
          city: hotel.city,
          isActive: true,
          id: { not: hotel.id },
        },
        select: {
          id: true, name: true, slug: true, coverImage: true, city: true, rating: true, reviewCount: true,
          hotel: {
            select: {
              roomTypes: {
                where: { isAvailable: true },
                take: 1,
                orderBy: { pricePerNight: 'asc' },
                select: { pricePerNight: true },
              },
            },
          },
        },
        take: 4,
        orderBy: { rating: 'desc' },
      }),
    ]);

    // Fire-and-forget: track view without blocking response
    prisma.establishment.update({
      where: { id: hotel.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
    prisma.establishmentView.create({
      data: { establishmentId: hotel.id, source: detectViewSource(request) },
    }).catch(() => {});

    const ownerData = owner ? {
      firstName: owner.firstName || '',
      lastName: owner.lastName || '',
      avatar: owner.avatar,
      memberSince: owner.createdAt.toISOString(),
    } : null;

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
        gallery: safeJsonParse(hotel.gallery, []),
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        isFeatured: hotel.isFeatured,
        isPremium: hotel.isPremium,
        viewCount: hotel.viewCount,
        starRating: hotel.hotel?.starRating || 0,
        checkInTime: hotel.hotel?.checkInTime || '14:00',
        checkOutTime: hotel.hotel?.checkOutTime || '11:00',
        amenities: safeJsonParse(hotel.hotel?.amenities, []),
        openingHours: safeJsonParse((hotel as Record<string, unknown>).openingHours as string, {}),
        priceRange: hotel.priceRange,
        descriptionEn: hotel.descriptionEn,
        shortDescriptionEn: hotel.shortDescriptionEn,
        dataSource: hotel.dataSource,
        sourceUrl: hotel.sourceUrl,
        sourceName: hotel.sourceName,
        isClaimed: hotel.isClaimed,
        claimedByUserId: hotel.claimedByUserId,
        owner: ownerData,
        roomTypes: hotel.hotel?.roomTypes?.map((room) => ({
          id: room.id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          bedType: room.bedType,
          size: room.size,
          pricePerNight: room.pricePerNight,
          priceWeekend: room.priceWeekend,
          amenities: safeJsonParse(room.amenities, []),
          images: safeJsonParse(room.images, []),
          isAvailable: room.isAvailable,
        })) || [],
        reviews: hotel.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          authorName: review.authorName,
          images: safeJsonParse(review.images, []),
          ownerResponse: review.ownerResponse,
          createdAt: review.createdAt.toISOString(),
        })),
      },
      similarHotels: similarHotels.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        coverImage: h.coverImage,
        city: h.city,
        rating: h.rating,
        reviewCount: h.reviewCount,
        lowestPrice: h.hotel?.roomTypes?.[0]?.pricePerNight || null,
      })),
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Hotel detail error:', error);
    return apiError('Erreur serveur', 500);
  }
}
