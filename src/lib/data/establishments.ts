import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';

/**
 * Fetch a restaurant by slug (for server-side rendering & metadata)
 */
export async function getRestaurantBySlug(slug: string) {
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
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!establishment || !establishment.restaurant) return null;

  const similarRestaurants = await prisma.establishment.findMany({
    where: {
      type: 'RESTAURANT',
      isActive: true,
      id: { not: establishment.id },
      OR: [
        { city: establishment.city },
        { restaurant: { category: establishment.restaurant.category } },
      ],
    },
    include: { restaurant: true },
    take: 3,
    orderBy: { rating: 'desc' },
  });

  // Increment views (fire-and-forget)
  prisma.establishment.update({
    where: { id: establishment.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return {
    restaurant: {
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
      instagram: establishment.instagram,
      whatsapp: establishment.whatsapp,
      isClaimed: establishment.isClaimed,
      nameEn: establishment.nameEn,
      descriptionEn: establishment.descriptionEn,
      shortDescriptionEn: establishment.shortDescriptionEn,
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
      reviews: establishment.reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        ownerResponse: r.ownerResponse,
      })),
    },
    similarRestaurants: similarRestaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      city: r.city,
      coverImage: r.coverImage,
      rating: r.rating,
      category: r.restaurant?.category,
      priceRange: r.restaurant?.priceRange,
    })),
  };
}

/**
 * Fetch a hotel by slug (for server-side rendering & metadata)
 */
export async function getHotelBySlug(slug: string) {
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
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!hotel) return null;

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

  // Increment views
  prisma.establishment.update({
    where: { id: hotel.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return {
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
      nameEn: hotel.nameEn,
      descriptionEn: hotel.descriptionEn,
      shortDescriptionEn: hotel.shortDescriptionEn,
      starRating: hotel.hotel?.starRating,
      hotelType: hotel.hotel?.hotelType,
      amenities: safeJsonParse(hotel.hotel?.amenities, []),
      checkInTime: hotel.hotel?.checkInTime,
      checkOutTime: hotel.hotel?.checkOutTime,
      openingHours: safeJsonParse(hotel.hotel?.openingHours, null),
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
  };
}

/**
 * Fetch an attraction by slug (for server-side rendering & metadata)
 */
export async function getAttractionBySlug(slug: string) {
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
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!establishment || !establishment.attraction) return null;

  const similarAttractions = await prisma.establishment.findMany({
    where: {
      type: 'ATTRACTION',
      isActive: true,
      id: { not: establishment.id },
      OR: [
        { city: establishment.city },
        { region: establishment.region },
        { attraction: { attractionType: establishment.attraction.attractionType } },
      ],
    },
    include: { attraction: true },
    take: 3,
    orderBy: { rating: 'desc' },
  });

  // Increment views
  prisma.establishment.update({
    where: { id: establishment.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return {
    attraction: {
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
      instagram: establishment.instagram,
      whatsapp: establishment.whatsapp,
      isClaimed: establishment.isClaimed,
      nameEn: establishment.nameEn,
      descriptionEn: establishment.descriptionEn,
      shortDescriptionEn: establishment.shortDescriptionEn,
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
      reviews: establishment.reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        ownerResponse: r.ownerResponse,
      })),
    },
    similarAttractions: similarAttractions.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      city: a.city,
      coverImage: a.coverImage,
      rating: a.rating,
      attractionType: a.attraction?.attractionType,
      isFree: a.attraction?.isFree,
      entryFeeLocal: a.attraction?.entryFeeLocal,
    })),
  };
}

/**
 * Fetch a provider by slug (for server-side rendering & metadata)
 */
export async function getProviderBySlug(slug: string) {
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
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!establishment || !establishment.provider) return null;

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

  // Increment views (fire-and-forget)
  prisma.establishment.update({
    where: { id: establishment.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return {
    provider: {
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
      instagram: establishment.instagram,
      whatsapp: establishment.whatsapp,
      isClaimed: establishment.isClaimed,
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
    },
    similarProviders: similarProviders.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      coverImage: p.coverImage,
      rating: p.rating,
      serviceType: p.provider?.serviceType,
      priceFrom: p.provider?.priceFrom,
    })),
  };
}
