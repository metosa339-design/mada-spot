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
        type: 'PROVIDER',
        isActive: true,
        moderationStatus: 'approved',
      },
      include: {
        provider: true,
        reviews: {
          where: { isPublished: true },
          select: { id: true, authorName: true, rating: true, title: true, comment: true, createdAt: true, ownerResponse: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!establishment || !establishment.provider) {
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: 404 }
      );
    }

    await Promise.all([
      prisma.establishment.update({
        where: { id: establishment.id },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.establishmentView.create({
        data: { establishmentId: establishment.id, source: detectViewSource(request) },
      }).catch(() => {}),
    ]);

    const similarProviders = await prisma.establishment.findMany({
      where: {
        type: 'PROVIDER',
        isActive: true,
        id: { not: establishment.id },
        OR: [
          { city: establishment.city },
          { provider: { serviceType: establishment.provider.serviceType } },
        ],
      },
      include: { provider: true },
      take: 3,
      orderBy: { rating: 'desc' },
    });

    const transformedProvider = {
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
      nameEn: establishment.nameEn,
      descriptionEn: establishment.descriptionEn,
      shortDescriptionEn: establishment.shortDescriptionEn,
      serviceType: establishment.provider.serviceType,
      languages: safeJsonParse(establishment.provider.languages, []),
      experience: establishment.provider.experience,
      priceRange: establishment.provider.priceRange,
      priceFrom: establishment.provider.priceFrom,
      priceTo: establishment.provider.priceTo,
      priceUnit: establishment.provider.priceUnit,
      isAvailable: establishment.provider.isAvailable,
      operatingZone: safeJsonParse(establishment.provider.operatingZone, []),
      vehicleType: establishment.provider.vehicleType,
      vehicleCapacity: establishment.provider.vehicleCapacity,
      licenseNumber: establishment.provider.licenseNumber,
      certifications: safeJsonParse(establishment.provider.certifications, []),
      reviews: establishment.reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        ownerResponse: r.ownerResponse,
      })),
    };

    const transformedSimilar = similarProviders.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      coverImage: p.coverImage,
      rating: p.rating,
      serviceType: p.provider?.serviceType,
      priceFrom: p.provider?.priceFrom,
    }));

    return NextResponse.json({
      provider: transformedProvider,
      similarProviders: transformedSimilar,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
