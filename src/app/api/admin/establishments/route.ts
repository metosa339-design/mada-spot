import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

// POST /api/admin/establishments - Create new establishment
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!sessionId) return apiError('Non autorisé', 401);
    const user = await getSession(sessionId);
    if (!user) return apiError('Non autorisé', 401);

    const data = await request.json().catch(() => null);

    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    if (!data.name || !data.type || !data.city) {
      return NextResponse.json({ error: 'Nom, type et ville requis' }, { status: 400 });
    }

    const slug = generateSlug(data.name);

    // Create base establishment
    const establishment = await prisma.establishment.create({
      data: {
        type: data.type,
        name: data.name,
        slug,
        description: data.description || null,
        shortDescription: data.shortDescription || null,
        nameEn: data.nameEn || null,
        descriptionEn: data.descriptionEn || null,
        shortDescriptionEn: data.shortDescriptionEn || null,
        address: data.address || null,
        city: data.city,
        district: data.district || null,
        region: data.region || null,
        latitude: safeFloat(data.latitude, -90, 90),
        longitude: safeFloat(data.longitude, -180, 180),
        phone: data.phone || null,
        phone2: data.phone2 || null,
        email: data.email || null,
        website: data.website || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        whatsapp: data.whatsapp || null,
        coverImage: data.coverImage || null,
        images: data.images ? (Array.isArray(data.images) ? JSON.stringify(data.images) : data.images) : null,
        isActive: data.isActive !== false,
        isFeatured: Boolean(data.isFeatured),
        isPremium: Boolean(data.isPremium),
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        dataSource: 'manual',
        moderationStatus: 'approved',
      },
    });

    // Create type-specific record
    if (data.type === 'HOTEL') {
      const hotel = await prisma.hotel.create({
        data: {
          establishmentId: establishment.id,
          starRating: safeInt(data.hotel?.starRating, 1, 5),
          hotelType: data.hotel?.hotelType || null,
          amenities: data.hotel?.amenities ? (Array.isArray(data.hotel.amenities) ? JSON.stringify(data.hotel.amenities) : data.hotel.amenities) : null,
          checkInTime: data.hotel?.checkInTime || null,
          checkOutTime: data.hotel?.checkOutTime || null,
        },
      });

      if (data.hotel?.roomTypes?.length) {
        for (const room of data.hotel.roomTypes) {
          await prisma.roomType.create({
            data: {
              hotelId: hotel.id,
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

    if (data.type === 'RESTAURANT') {
      await prisma.restaurant.create({
        data: {
          establishmentId: establishment.id,
          category: data.restaurant?.category || 'RESTAURANT',
          priceRange: data.restaurant?.priceRange || 'MODERATE',
          cuisineTypes: data.restaurant?.cuisineTypes ? (Array.isArray(data.restaurant.cuisineTypes) ? JSON.stringify(data.restaurant.cuisineTypes) : data.restaurant.cuisineTypes) : null,
          specialties: data.restaurant?.specialties ? (Array.isArray(data.restaurant.specialties) ? JSON.stringify(data.restaurant.specialties) : data.restaurant.specialties) : null,
          menuPdfUrl: data.restaurant?.menuPdfUrl || null,
          menuImages: data.restaurant?.menuImages ? (Array.isArray(data.restaurant.menuImages) ? JSON.stringify(data.restaurant.menuImages) : data.restaurant.menuImages) : null,
          openingHours: data.restaurant?.openingHours ? (typeof data.restaurant.openingHours === 'object' ? JSON.stringify(data.restaurant.openingHours) : data.restaurant.openingHours) : null,
          avgMainCourse: safeFloat(data.restaurant?.avgMainCourse, 0, 100000000),
          avgBeer: safeFloat(data.restaurant?.avgBeer, 0, 100000000),
          hasDelivery: Boolean(data.restaurant?.hasDelivery),
          hasTakeaway: Boolean(data.restaurant?.hasTakeaway),
          hasReservation: Boolean(data.restaurant?.hasReservation),
          hasParking: Boolean(data.restaurant?.hasParking),
          hasWifi: Boolean(data.restaurant?.hasWifi),
          hasGenerator: Boolean(data.restaurant?.hasGenerator),
        },
      });
    }

    if (data.type === 'ATTRACTION') {
      await prisma.attraction.create({
        data: {
          establishmentId: establishment.id,
          attractionType: data.attraction?.attractionType || 'park',
          isFree: Boolean(data.attraction?.isFree),
          entryFeeForeign: safeFloat(data.attraction?.entryFeeForeign, 0, 100000000),
          entryFeeLocal: safeFloat(data.attraction?.entryFeeLocal, 0, 100000000),
          visitDuration: data.attraction?.visitDuration || null,
          bestSeason: data.attraction?.bestSeason || null,
          bestTimeToVisit: data.attraction?.bestTimeToVisit || null,
          highlights: data.attraction?.highlights ? (Array.isArray(data.attraction.highlights) ? JSON.stringify(data.attraction.highlights) : data.attraction.highlights) : null,
          isAccessible: Boolean(data.attraction?.isAccessible),
          hasGuide: Boolean(data.attraction?.hasGuide),
          hasParking: Boolean(data.attraction?.hasParking),
          hasRestaurant: Boolean(data.attraction?.hasRestaurant),
        },
      });
    }

    if (data.type === 'PROVIDER') {
      await prisma.provider.create({
        data: {
          establishmentId: establishment.id,
          serviceType: data.provider?.serviceType || 'OTHER',
          languages: data.provider?.languages ? (Array.isArray(data.provider.languages) ? JSON.stringify(data.provider.languages) : data.provider.languages) : null,
          experience: data.provider?.experience || null,
          priceRange: data.provider?.priceRange || null,
          priceFrom: safeFloat(data.provider?.priceFrom, 0, 100000000),
          priceTo: safeFloat(data.provider?.priceTo, 0, 100000000),
          priceUnit: data.provider?.priceUnit || null,
          operatingZone: data.provider?.operatingZone ? (Array.isArray(data.provider.operatingZone) ? JSON.stringify(data.provider.operatingZone) : data.provider.operatingZone) : null,
          vehicleType: data.provider?.vehicleType || null,
          vehicleCapacity: safeInt(data.provider?.vehicleCapacity, 1, 100),
          licenseNumber: data.provider?.licenseNumber || null,
          certifications: data.provider?.certifications ? (Array.isArray(data.provider.certifications) ? JSON.stringify(data.provider.certifications) : data.provider.certifications) : null,
        },
      });
    }

    const result = await prisma.establishment.findUnique({
      where: { id: establishment.id },
      include: { hotel: { include: { roomTypes: true } }, restaurant: true, attraction: true, provider: true },
    });

    return NextResponse.json({ success: true, establishment: result }, { status: 201 });
  } catch (error) {
    logger.error('Error creating establishment:', error);
    return apiError('Erreur serveur', 500);
  }
}

// GET /api/admin/establishments - List establishments with moderation filters
export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const authUser = await getSession(sessionId);
  if (!authUser) return apiError('Non autorisé', 401);

  try {
    const { searchParams } = new URL(request.url);
    const VALID_STATUSES = ['pending_review', 'approved', 'rejected'];
    const VALID_TYPES = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'];

    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {};

    if (statusParam && VALID_STATUSES.includes(statusParam)) where.moderationStatus = statusParam;
    if (typeParam && VALID_TYPES.includes(typeParam)) where.type = typeParam;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rawEstablishments, total, pendingCount] = await Promise.all([
      prisma.establishment.findMany({
        where,
        include: {
          hotel: { select: { starRating: true, hotelType: true } },
          restaurant: { select: { category: true, priceRange: true } },
          attraction: { select: { attractionType: true } },
          provider: { select: { serviceType: true } },
        },
        orderBy: [
          { moderationStatus: 'asc' }, // pending_review first
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.establishment.count({ where }),
      prisma.establishment.count({ where: { moderationStatus: 'pending_review' } }),
    ]);

    // Enrich with submitter info for user_contribution
    const submitterIds = rawEstablishments
      .filter((e) => e.claimedByUserId && e.dataSource === 'user_contribution')
      .map((e) => e.claimedByUserId!);

    const submitters = submitterIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: submitterIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];

    const submitterMap = new Map(submitters.map((u) => [u.id, u]));

    const establishments = rawEstablishments.map((est) => ({
      ...est,
      submitter: est.claimedByUserId ? submitterMap.get(est.claimedByUserId) || null : null,
    }));

    return NextResponse.json({ establishments, total, pendingCount });
  } catch (error) {
    logger.error('Error fetching establishments:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/admin/establishments - Update moderation status
export async function PUT(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const authUser = await getSession(sessionId);
  if (!authUser) return apiError('Non autorisé', 401);

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const {
      id,
      moderationStatus,
      moderationNote,
      isActive,
      // Multilingual fields
      nameEn,
      descriptionEn,
      shortDescriptionEn,
      // Type-specific fields
      openingHours,
      isAvailable,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: any = {};
    if (moderationStatus) updateData.moderationStatus = moderationStatus;
    if (moderationNote !== undefined) updateData.moderationNote = moderationNote;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Multilingual fields
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (shortDescriptionEn !== undefined) updateData.shortDescriptionEn = shortDescriptionEn;

    // If approving, also make it active
    if (moderationStatus === 'approved') {
      updateData.isActive = true;
    }

    // If rejecting, deactivate
    if (moderationStatus === 'rejected') {
      updateData.isActive = false;
    }

    const updated = await prisma.establishment.update({
      where: { id },
      data: updateData,
    });

    // Update type-specific fields
    if (openingHours !== undefined || isAvailable !== undefined) {
      const establishment = await prisma.establishment.findUnique({
        where: { id },
        select: { type: true },
      });

      if (establishment?.type === 'HOTEL' && openingHours !== undefined) {
        await prisma.hotel.updateMany({
          where: { establishmentId: id },
          data: { openingHours: typeof openingHours === 'string' ? openingHours : JSON.stringify(openingHours) },
        });
      }

      if (establishment?.type === 'ATTRACTION') {
        const attractionData: any = {};
        if (openingHours !== undefined) {
          attractionData.openingHours = typeof openingHours === 'string' ? openingHours : JSON.stringify(openingHours);
        }
        if (isAvailable !== undefined) {
          attractionData.isAvailable = isAvailable;
        }
        if (Object.keys(attractionData).length > 0) {
          await prisma.attraction.updateMany({
            where: { establishmentId: id },
            data: attractionData,
          });
        }
      }
    }

    return NextResponse.json({ establishment: updated });
  } catch (error) {
    logger.error('Error updating establishment:', error);
    return apiError('Erreur serveur', 500);
  }
}

// DELETE /api/admin/establishments - Soft delete (deactivate)
export async function DELETE(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const authUser = await getSession(sessionId);
  if (!authUser) return apiError('Non autorisé', 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.establishment.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting establishment:', error);
    return apiError('Erreur serveur', 500);
  }
}
