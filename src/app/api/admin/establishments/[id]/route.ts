import { checkAdminAuth } from '@/lib/api/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';
function safeFloat(val: unknown, min: number, max: number): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val));
  if (isNaN(n) || n < min || n > max) return null;
  return n;
}

function safeInt(val: unknown, min: number, max: number): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = parseInt(String(val), 10);
  if (isNaN(n) || n < min || n > max) return null;
  return n;
}

// GET /api/admin/establishments/[id] - Get single establishment with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const establishment = await prisma.establishment.findUnique({
      where: { id },
      include: {
        hotel: {
          include: {
            roomTypes: { orderBy: { pricePerNight: 'asc' } },
          },
        },
        restaurant: true,
        attraction: true,
        reviews: {
          select: { id: true, establishmentId: true, authorName: true, authorEmail: true, userId: true, rating: true, title: true, comment: true, images: true, isVerified: true, isPublished: true, ownerResponse: true, respondedAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        claims: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!establishment) {
      return NextResponse.json({ success: false, error: 'Établissement non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, establishment });
  } catch (error) {
    logger.error('Error fetching establishment:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/admin/establishments/[id] - Full update of establishment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // Check existence
    const existing = await prisma.establishment.findUnique({
      where: { id },
      select: { type: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Établissement non trouvé' }, { status: 404 });
    }

    // Build base establishment update
    const establishmentData: any = {};
    const baseFields = [
      'name', 'description', 'shortDescription', 'nameEn', 'descriptionEn', 'shortDescriptionEn',
      'address', 'city', 'district', 'region', 'phone', 'phone2', 'email', 'website',
      'facebook', 'instagram', 'whatsapp', 'coverImage', 'metaTitle', 'metaDescription',
      'moderationStatus', 'moderationNote',
    ];

    for (const field of baseFields) {
      if (data[field] !== undefined) {
        establishmentData[field] = data[field] || null;
      }
    }

    // Boolean fields
    if (data.isActive !== undefined) establishmentData.isActive = Boolean(data.isActive);
    if (data.isFeatured !== undefined) establishmentData.isFeatured = Boolean(data.isFeatured);
    if (data.isPremium !== undefined) establishmentData.isPremium = Boolean(data.isPremium);

    // Numeric fields
    if (data.latitude !== undefined) establishmentData.latitude = safeFloat(data.latitude, -90, 90);
    if (data.longitude !== undefined) establishmentData.longitude = safeFloat(data.longitude, -180, 180);

    // Images (JSON array)
    if (data.images !== undefined) {
      establishmentData.images = Array.isArray(data.images) ? JSON.stringify(data.images) : data.images;
    }

    // Auto moderation logic
    if (data.moderationStatus === 'approved') establishmentData.isActive = true;
    if (data.moderationStatus === 'rejected') establishmentData.isActive = false;

    // Update base establishment
    await prisma.establishment.update({
      where: { id },
      data: establishmentData,
    });

    // Update type-specific data
    if (existing.type === 'HOTEL' && data.hotel) {
      const hotelData: any = {};
      if (data.hotel.starRating !== undefined) hotelData.starRating = safeInt(data.hotel.starRating, 1, 5);
      if (data.hotel.hotelType !== undefined) hotelData.hotelType = data.hotel.hotelType || null;
      if (data.hotel.checkInTime !== undefined) hotelData.checkInTime = data.hotel.checkInTime || null;
      if (data.hotel.checkOutTime !== undefined) hotelData.checkOutTime = data.hotel.checkOutTime || null;
      if (data.hotel.amenities !== undefined) {
        hotelData.amenities = Array.isArray(data.hotel.amenities) ? JSON.stringify(data.hotel.amenities) : data.hotel.amenities;
      }
      if (data.hotel.openingHours !== undefined) {
        hotelData.openingHours = typeof data.hotel.openingHours === 'object' ? JSON.stringify(data.hotel.openingHours) : data.hotel.openingHours;
      }

      if (Object.keys(hotelData).length > 0) {
        await prisma.hotel.updateMany({
          where: { establishmentId: id },
          data: hotelData,
        });
      }

      // Handle room types
      if (data.hotel.roomTypes) {
        // Delete existing room types and recreate
        const hotelRecord = await prisma.hotel.findUnique({ where: { establishmentId: id } });
        if (hotelRecord) {
          await prisma.roomType.deleteMany({ where: { hotelId: hotelRecord.id } });
          for (const room of data.hotel.roomTypes) {
            await prisma.roomType.create({
              data: {
                hotelId: hotelRecord.id,
                name: room.name || 'Chambre',
                description: room.description || null,
                capacity: safeInt(room.capacity, 1, 100) ?? 2,
                pricePerNight: safeFloat(room.pricePerNight, 0, 100000000) ?? 0,
                priceWeekend: safeFloat(room.priceWeekend, 0, 100000000),
                amenities: room.amenities ? (Array.isArray(room.amenities) ? JSON.stringify(room.amenities) : room.amenities) : null,
                images: room.images ? (Array.isArray(room.images) ? JSON.stringify(room.images) : room.images) : null,
                isAvailable: room.isAvailable !== false,
              },
            });
          }
        }
      }
    }

    if (existing.type === 'RESTAURANT' && data.restaurant) {
      const restData: any = {};
      if (data.restaurant.category !== undefined) restData.category = data.restaurant.category;
      if (data.restaurant.priceRange !== undefined) restData.priceRange = data.restaurant.priceRange;
      if (data.restaurant.cuisineTypes !== undefined) {
        restData.cuisineTypes = Array.isArray(data.restaurant.cuisineTypes) ? JSON.stringify(data.restaurant.cuisineTypes) : data.restaurant.cuisineTypes;
      }
      if (data.restaurant.specialties !== undefined) {
        restData.specialties = Array.isArray(data.restaurant.specialties) ? JSON.stringify(data.restaurant.specialties) : data.restaurant.specialties;
      }
      if (data.restaurant.menuPdfUrl !== undefined) restData.menuPdfUrl = data.restaurant.menuPdfUrl || null;
      if (data.restaurant.menuImages !== undefined) {
        restData.menuImages = Array.isArray(data.restaurant.menuImages) ? JSON.stringify(data.restaurant.menuImages) : data.restaurant.menuImages;
      }
      if (data.restaurant.openingHours !== undefined) {
        restData.openingHours = typeof data.restaurant.openingHours === 'object' ? JSON.stringify(data.restaurant.openingHours) : data.restaurant.openingHours;
      }
      if (data.restaurant.avgMainCourse !== undefined) restData.avgMainCourse = safeFloat(data.restaurant.avgMainCourse, 0, 100000000);
      if (data.restaurant.avgBeer !== undefined) restData.avgBeer = safeFloat(data.restaurant.avgBeer, 0, 100000000);

      // Boolean fields
      const boolFields = ['hasDelivery', 'hasTakeaway', 'hasReservation', 'hasParking', 'hasWifi', 'hasGenerator'];
      for (const bf of boolFields) {
        if (data.restaurant[bf] !== undefined) restData[bf] = Boolean(data.restaurant[bf]);
      }

      if (Object.keys(restData).length > 0) {
        await prisma.restaurant.updateMany({
          where: { establishmentId: id },
          data: restData,
        });
      }
    }

    if (existing.type === 'ATTRACTION' && data.attraction) {
      const attrData: any = {};
      if (data.attraction.attractionType !== undefined) attrData.attractionType = data.attraction.attractionType;
      if (data.attraction.isFree !== undefined) attrData.isFree = Boolean(data.attraction.isFree);
      if (data.attraction.entryFeeForeign !== undefined) attrData.entryFeeForeign = safeFloat(data.attraction.entryFeeForeign, 0, 100000000);
      if (data.attraction.entryFeeLocal !== undefined) attrData.entryFeeLocal = safeFloat(data.attraction.entryFeeLocal, 0, 100000000);
      if (data.attraction.visitDuration !== undefined) attrData.visitDuration = data.attraction.visitDuration || null;
      if (data.attraction.bestSeason !== undefined) attrData.bestSeason = data.attraction.bestSeason || null;
      if (data.attraction.bestTimeToVisit !== undefined) attrData.bestTimeToVisit = data.attraction.bestTimeToVisit || null;
      if (data.attraction.highlights !== undefined) {
        attrData.highlights = Array.isArray(data.attraction.highlights) ? JSON.stringify(data.attraction.highlights) : data.attraction.highlights;
      }
      if (data.attraction.openingHours !== undefined) {
        attrData.openingHours = typeof data.attraction.openingHours === 'object' ? JSON.stringify(data.attraction.openingHours) : data.attraction.openingHours;
      }

      const boolFields = ['isAccessible', 'hasGuide', 'hasParking', 'hasRestaurant', 'isAvailable'];
      for (const bf of boolFields) {
        if (data.attraction[bf] !== undefined) attrData[bf] = Boolean(data.attraction[bf]);
      }

      if (Object.keys(attrData).length > 0) {
        await prisma.attraction.updateMany({
          where: { establishmentId: id },
          data: attrData,
        });
      }
    }

    // Return updated establishment with all relations
    const result = await prisma.establishment.findUnique({
      where: { id },
      include: {
        hotel: { include: { roomTypes: true } },
        restaurant: true,
        attraction: true,
      },
    });

    return NextResponse.json({ success: true, establishment: result });
  } catch (error) {
    logger.error('Error updating establishment:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/establishments/[id] - Delete establishment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.establishment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting establishment:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
