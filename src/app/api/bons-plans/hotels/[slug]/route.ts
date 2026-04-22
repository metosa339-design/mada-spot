import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { safeJsonParse } from '@/lib/api-response';
import { cachedQuery } from '@/lib/cache';

import { logger } from '@/lib/logger';
import { detectViewSource } from '@/lib/utils/detect-view-source';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const hotel = await cachedQuery(`hotel:${slug}`, 120, () => prisma.establishment.findFirst({
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
    }));

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel non trouvé' }, { status: 404 });
    }

    // Cast to any to avoid strict type issues with optional Prisma fields
    const h = hotel as any;

    // Run all secondary queries in parallel (non-blocking)
    const [owner, similarHotels] = await Promise.all([
      // Fetch owner
      h.claimedByUserId
        ? prisma.user.findUnique({
            where: { id: h.claimedByUserId },
            select: { firstName: true, lastName: true, avatar: true, createdAt: true },
          })
        : null,
      // Similar hotels
      prisma.establishment.findMany({
        where: {
          type: 'HOTEL',
          city: h.city,
          isActive: true,
          id: { not: h.id },
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
      where: { id: h.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
    prisma.establishmentView.create({
      data: { establishmentId: h.id, source: detectViewSource(request) },
    }).catch(() => {});

    const ownerData = owner ? {
      firstName: owner.firstName || '',
      lastName: owner.lastName || '',
      avatar: owner.avatar,
      memberSince: owner.createdAt.toISOString(),
    } : null;

    return NextResponse.json({
      hotel: {
        id: h.id,
        name: h.name,
        slug: h.slug,
        description: h.description,
        shortDescription: h.shortDescription,
        address: h.address,
        city: h.city,
        district: h.district,
        region: h.region,
        latitude: h.latitude,
        longitude: h.longitude,
        phone: h.phone,
        phone2: h.phone2,
        email: h.email,
        website: h.website,
        facebook: h.facebook,
        instagram: h.instagram,
        whatsapp: h.whatsapp,
        coverImage: h.coverImage,
        images: safeJsonParse(h.images, []),
        gallery: safeJsonParse(h.gallery, []),
        rating: h.rating,
        reviewCount: h.reviewCount,
        isFeatured: h.isFeatured,
        isPremium: h.isPremium,
        viewCount: h.viewCount,
        starRating: h.hotel?.starRating || 0,
        checkInTime: h.hotel?.checkInTime || '14:00',
        checkOutTime: h.hotel?.checkOutTime || '11:00',
        amenities: safeJsonParse(h.hotel?.amenities, []),
        openingHours: safeJsonParse(h.openingHours, {}),
        priceRange: h.priceRange,
        descriptionEn: h.descriptionEn,
        shortDescriptionEn: h.shortDescriptionEn,
        dataSource: h.dataSource,
        sourceUrl: h.sourceUrl,
        sourceName: h.sourceName,
        isClaimed: h.isClaimed,
        claimedByUserId: h.claimedByUserId,
        owner: ownerData,
        roomTypes: h.hotel?.roomTypes?.map((room: any) => ({
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
        reviews: h.reviews.map((review: any) => ({
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
      similarHotels: similarHotels.map((sh: any) => ({
        id: sh.id,
        name: sh.name,
        slug: sh.slug,
        coverImage: sh.coverImage,
        city: sh.city,
        rating: sh.rating,
        reviewCount: sh.reviewCount,
        lowestPrice: sh.hotel?.roomTypes?.[0]?.pricePerNight || null,
      })),
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Hotel detail error:', error);
    return apiError('Erreur serveur', 500);
  }
}
