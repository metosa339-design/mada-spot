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
        type: 'RESTAURANT',
        isActive: true,
        moderationStatus: 'approved',
      },
      include: {
        restaurant: true,
        reviews: {
          where: { isPublished: true },
          select: { id: true, authorName: true, rating: true, title: true, comment: true, createdAt: true, ownerResponse: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!establishment || !establishment.restaurant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      );
    }

    // Run owner + similar in parallel, fire-and-forget view tracking
    const [owner, similarRestaurants] = await Promise.all([
      establishment.claimedByUserId
        ? prisma.user.findUnique({
            where: { id: establishment.claimedByUserId },
            select: { firstName: true, lastName: true, avatar: true, createdAt: true },
          }).then(u => u ? { firstName: u.firstName || '', lastName: u.lastName || '', avatar: u.avatar, memberSince: u.createdAt.toISOString() } : null)
        : null,
      prisma.establishment.findMany({
        where: {
          type: 'RESTAURANT',
          isActive: true,
          id: { not: establishment.id },
          OR: [
            { city: establishment.city },
            { restaurant: { category: establishment.restaurant.category } },
          ],
        },
        select: {
          id: true, name: true, slug: true, coverImage: true, city: true, rating: true, reviewCount: true,
          restaurant: { select: { category: true, priceRange: true } },
        },
        take: 3,
        orderBy: { rating: 'desc' },
      }),
    ]);

    // Fire-and-forget
    prisma.establishment.update({ where: { id: establishment.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    prisma.establishmentView.create({ data: { establishmentId: establishment.id, source: detectViewSource(request) } }).catch(() => {});

    const transformedRestaurant = {
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
      whatsapp: establishment.whatsapp,
      instagram: establishment.instagram,
      isClaimed: establishment.isClaimed,
      claimedByUserId: establishment.claimedByUserId,
      // Multilingual
      nameEn: establishment.nameEn,
      descriptionEn: establishment.descriptionEn,
      shortDescriptionEn: establishment.shortDescriptionEn,
      // Restaurant specific
      category: establishment.restaurant.category,
      cuisineTypes: safeJsonParse(establishment.restaurant.cuisineTypes, []),
      priceRange: establishment.restaurant.priceRange,
      menuImages: safeJsonParse(establishment.restaurant.menuImages, []),
      menuPdfUrl: establishment.restaurant.menuPdfUrl,
      openingHours: safeJsonParse(establishment.restaurant.openingHours, {}),
      hasDelivery: establishment.restaurant.hasDelivery,
      hasTakeaway: establishment.restaurant.hasTakeaway,
      hasWifi: establishment.restaurant.hasWifi,
      hasParking: establishment.restaurant.hasParking,
      hasReservation: establishment.restaurant.hasReservation,
      avgMainCourse: establishment.restaurant.avgMainCourse,
      avgBeer: establishment.restaurant.avgBeer,
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

    const transformedSimilar = similarRestaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      city: r.city,
      coverImage: r.coverImage,
      rating: r.rating,
      category: r.restaurant?.category,
      priceRange: r.restaurant?.priceRange,
    }));

    return NextResponse.json({
      restaurant: transformedRestaurant,
      similarRestaurants: transformedSimilar,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
