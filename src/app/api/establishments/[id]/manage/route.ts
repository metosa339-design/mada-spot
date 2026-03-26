
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';
// Helper: verify user owns this establishment (via claim)
async function getOwnerEstablishment(request: NextRequest, establishmentId: string) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: 'Non autorisé', status: 401 };

  const session = await verifySession(token);
  if (!session) return { error: 'Session invalide', status: 401 };

  const establishment = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    include: {
      hotel: { include: { roomTypes: { orderBy: { pricePerNight: 'asc' } } } },
      restaurant: true,
      attraction: true,
      reviews: {
        select: { id: true, establishmentId: true, authorName: true, authorEmail: true, userId: true, rating: true, title: true, comment: true, images: true, isVerified: true, isPublished: true, ownerResponse: true, respondedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!establishment) return { error: 'Établissement non trouvé', status: 404 };
  if (!establishment.isClaimed || establishment.claimedByUserId !== session.id) {
    return { error: 'Vous n\'êtes pas propriétaire de cet établissement', status: 403 };
  }

  return { establishment, userId: session.id };
}

// GET /api/establishments/[id]/manage - Get establishment data for owner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getOwnerEstablishment(request, id);

    if ('error' in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    // Get analytics
    const reviewStats = await prisma.establishmentReview.aggregate({
      where: { establishmentId: id, isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      establishment: result.establishment,
      stats: {
        viewCount: result.establishment.viewCount,
        reviewCount: reviewStats._count.id,
        avgRating: reviewStats._avg.rating || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching establishment:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/establishments/[id]/manage - Update establishment (owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const csrf = request.headers.get('x-csrf-token');
    if (!csrf || !verifyCsrfToken(csrf)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide' }, { status: 403 });
    }

    const result = await getOwnerEstablishment(request, id);

    if ('error' in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    const data = await request.json().catch(() => null);


    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const est = result.establishment;

    // Owner can update these base fields
    const allowedFields = [
      'description', 'shortDescription', 'nameEn', 'descriptionEn', 'shortDescriptionEn',
      'address', 'phone', 'phone2', 'email', 'website', 'facebook', 'instagram', 'whatsapp',
      'coverImage',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field] || null;
    }

    // Images
    if (data.images !== undefined) {
      updateData.images = Array.isArray(data.images) ? JSON.stringify(data.images) : data.images;
    }

    // Coordinates
    if (data.latitude !== undefined) updateData.latitude = data.latitude ? parseFloat(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude ? parseFloat(data.longitude) : null;

    await prisma.establishment.update({ where: { id }, data: updateData });

    // Hotel-specific updates
    if (est.type === 'HOTEL' && data.hotel) {
      const hotelData: any = {};
      if (data.hotel.amenities !== undefined) {
        hotelData.amenities = Array.isArray(data.hotel.amenities) ? JSON.stringify(data.hotel.amenities) : data.hotel.amenities;
      }
      if (data.hotel.checkInTime !== undefined) hotelData.checkInTime = data.hotel.checkInTime || null;
      if (data.hotel.checkOutTime !== undefined) hotelData.checkOutTime = data.hotel.checkOutTime || null;
      if (data.hotel.openingHours !== undefined) {
        hotelData.openingHours = typeof data.hotel.openingHours === 'object' ? JSON.stringify(data.hotel.openingHours) : data.hotel.openingHours;
      }
      if (Object.keys(hotelData).length > 0) {
        await prisma.hotel.updateMany({ where: { establishmentId: id }, data: hotelData });
      }

      // Room types management
      if (data.hotel.roomTypes) {
        const hotelRecord = await prisma.hotel.findUnique({ where: { establishmentId: id } });
        if (hotelRecord) {
          await prisma.roomType.deleteMany({ where: { hotelId: hotelRecord.id } });
          for (const room of data.hotel.roomTypes) {
            await prisma.roomType.create({
              data: {
                hotelId: hotelRecord.id,
                name: room.name || 'Chambre',
                description: room.description || null,
                capacity: parseInt(room.capacity) || 2,
                pricePerNight: parseFloat(room.pricePerNight) || 0,
                priceWeekend: room.priceWeekend ? parseFloat(room.priceWeekend) : null,
                amenities: room.amenities ? (Array.isArray(room.amenities) ? JSON.stringify(room.amenities) : room.amenities) : null,
                images: room.images ? (Array.isArray(room.images) ? JSON.stringify(room.images) : room.images) : null,
                isAvailable: room.isAvailable !== false,
              },
            });
          }
        }
      }
    }

    // Restaurant-specific updates
    if (est.type === 'RESTAURANT' && data.restaurant) {
      const restData: any = {};
      if (data.restaurant.cuisineTypes !== undefined) restData.cuisineTypes = Array.isArray(data.restaurant.cuisineTypes) ? JSON.stringify(data.restaurant.cuisineTypes) : data.restaurant.cuisineTypes;
      if (data.restaurant.specialties !== undefined) restData.specialties = Array.isArray(data.restaurant.specialties) ? JSON.stringify(data.restaurant.specialties) : data.restaurant.specialties;
      if (data.restaurant.menuPdfUrl !== undefined) restData.menuPdfUrl = data.restaurant.menuPdfUrl || null;
      if (data.restaurant.menuImages !== undefined) restData.menuImages = Array.isArray(data.restaurant.menuImages) ? JSON.stringify(data.restaurant.menuImages) : data.restaurant.menuImages;
      if (data.restaurant.openingHours !== undefined) restData.openingHours = typeof data.restaurant.openingHours === 'object' ? JSON.stringify(data.restaurant.openingHours) : data.restaurant.openingHours;
      if (data.restaurant.avgMainCourse !== undefined) restData.avgMainCourse = data.restaurant.avgMainCourse ? parseFloat(data.restaurant.avgMainCourse) : null;
      if (data.restaurant.avgBeer !== undefined) restData.avgBeer = data.restaurant.avgBeer ? parseFloat(data.restaurant.avgBeer) : null;
      const boolFields = ['hasDelivery', 'hasTakeaway', 'hasReservation', 'hasParking', 'hasWifi', 'hasGenerator'];
      for (const bf of boolFields) {
        if (data.restaurant[bf] !== undefined) restData[bf] = Boolean(data.restaurant[bf]);
      }
      if (Object.keys(restData).length > 0) {
        await prisma.restaurant.updateMany({ where: { establishmentId: id }, data: restData });
      }
    }

    // Attraction-specific updates
    if (est.type === 'ATTRACTION' && data.attraction) {
      const attrData: any = {};
      if (data.attraction.entryFeeForeign !== undefined) attrData.entryFeeForeign = data.attraction.entryFeeForeign ? parseFloat(data.attraction.entryFeeForeign) : null;
      if (data.attraction.entryFeeLocal !== undefined) attrData.entryFeeLocal = data.attraction.entryFeeLocal ? parseFloat(data.attraction.entryFeeLocal) : null;
      if (data.attraction.visitDuration !== undefined) attrData.visitDuration = data.attraction.visitDuration || null;
      if (data.attraction.bestSeason !== undefined) attrData.bestSeason = data.attraction.bestSeason || null;
      if (data.attraction.highlights !== undefined) attrData.highlights = Array.isArray(data.attraction.highlights) ? JSON.stringify(data.attraction.highlights) : data.attraction.highlights;
      if (data.attraction.openingHours !== undefined) attrData.openingHours = typeof data.attraction.openingHours === 'object' ? JSON.stringify(data.attraction.openingHours) : data.attraction.openingHours;
      const boolFields = ['isAccessible', 'hasGuide', 'hasParking', 'hasRestaurant'];
      for (const bf of boolFields) {
        if (data.attraction[bf] !== undefined) attrData[bf] = Boolean(data.attraction[bf]);
      }
      if (Object.keys(attrData).length > 0) {
        await prisma.attraction.updateMany({ where: { establishmentId: id }, data: attrData });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating establishment:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
