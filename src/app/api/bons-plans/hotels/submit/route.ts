import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { logger } from '@/lib/logger';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    const {
      name, shortDescription, description, hotelType,
      province, region, city, district, latitude, longitude,
      starRating, amenities, checkInTime, checkOutTime, roomTypes,
      coverImage, images, phone, email, website, facebook, instagram, whatsapp,
    } = body;

    if (!name || !description || !city || !hotelType) {
      return NextResponse.json(
        { success: false, error: 'Nom, description, ville et type d\'hébergement sont requis' },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    const existingSlug = await prisma.establishment.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const establishment = await tx.establishment.create({
        data: {
          type: 'HOTEL',
          name,
          slug,
          description,
          shortDescription: shortDescription || null,
          city,
          district: district || null,
          region: region || null,
          address: province ? `${province}, ${region || ''}` : null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          coverImage: coverImage || null,
          images: images ? JSON.stringify(images) : null,
          phone: phone || null,
          email: email || null,
          website: website || null,
          facebook: facebook || null,
          instagram: instagram || null,
          whatsapp: whatsapp || null,
          isActive: false,
          moderationStatus: 'pending_review',
          dataSource: 'user_contribution',
          claimedByUserId: user.id,
          claimedAt: new Date(),
          isClaimed: true,
        },
      });

      const hotel = await tx.hotel.create({
        data: {
          establishmentId: establishment.id,
          hotelType: hotelType || null,
          starRating: starRating ? parseInt(starRating) : null,
          amenities: amenities ? JSON.stringify(amenities) : null,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
        },
      });

      // Create room types if provided
      if (roomTypes && Array.isArray(roomTypes) && roomTypes.length > 0) {
        await tx.roomType.createMany({
          data: roomTypes.map((room: { name: string; description?: string; capacity?: number; pricePerNight: number; priceWeekend?: number }) => ({
            hotelId: hotel.id,
            name: room.name,
            description: room.description || null,
            capacity: room.capacity ? parseInt(String(room.capacity)) : 2,
            pricePerNight: parseFloat(String(room.pricePerNight)),
            priceWeekend: room.priceWeekend ? parseFloat(String(room.priceWeekend)) : null,
          })),
        });
      }

      const admins = await tx.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM' as const,
            title: 'Nouvel hébergement soumis',
            message: `${user.firstName} ${user.lastName} a soumis "${name}" (${city})`,
            entityType: 'establishment',
            entityId: establishment.id,
          })),
        });
      }

      // Mettre à jour userType si pas encore défini
      const currentUser = await tx.user.findUnique({ where: { id: user.id }, select: { userType: true } });
      if (!currentUser?.userType) {
        await tx.user.update({ where: { id: user.id }, data: { userType: 'HOTEL' } });
      }

      return establishment;
    });

    return NextResponse.json({
      success: true,
      slug: result.slug,
      message: 'Votre hébergement a été soumis avec succès ! Il sera visible après validation par notre équipe.',
    });
  } catch (error) {
    logger.error('Erreur soumission hôtel:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la soumission' },
      { status: 500 }
    );
  }
}
