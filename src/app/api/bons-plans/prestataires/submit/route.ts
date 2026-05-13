import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth/middleware';
import { logger } from '@/lib/logger';
import { providerSubmitSchema, withUniqueSlug } from '@/lib/validations/establishment-submit';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    const parsed = providerSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const result = await withUniqueSlug(data.name, async (tx, slug) => {
      const establishment = await tx.establishment.create({
        data: {
          type: 'PROVIDER',
          name: data.name,
          slug,
          description: data.description,
          shortDescription: data.shortDescription || null,
          city: data.city,
          district: data.district || null,
          region: data.region || null,
          address: data.province ? `${data.province}, ${data.region || ''}` : null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          coverImage: data.coverImage || null,
          images: data.images ? JSON.stringify(data.images) : null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          facebook: data.facebook || null,
          instagram: data.instagram || null,
          whatsapp: data.whatsapp || null,
          isActive: false,
          moderationStatus: 'pending_review',
          dataSource: 'user_contribution',
          claimedByUserId: user.id,
          claimedAt: new Date(),
          isClaimed: true,
        },
      });

      await tx.provider.create({
        data: {
          establishmentId: establishment.id,
          serviceType: data.serviceType,
          languages: data.languages ? JSON.stringify(data.languages) : null,
          experience: data.experience || null,
          priceRange: data.priceRange || null,
          priceFrom: data.priceFrom ?? null,
          priceTo: data.priceTo ?? null,
          priceUnit: data.priceUnit || null,
          operatingZone: data.operatingZone ? JSON.stringify(data.operatingZone) : null,
          vehicleType: data.vehicleType || null,
          vehicleCapacity: data.vehicleCapacity ?? null,
          licenseNumber: data.licenseNumber || null,
          certifications: data.certifications ? JSON.stringify(data.certifications) : null,
        },
      });

      const admins = await tx.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM' as const,
            title: 'Nouveau prestataire soumis',
            message: `${user.firstName} ${user.lastName} a soumis "${data.name}" (${data.city})`,
            entityType: 'establishment',
            entityId: establishment.id,
          })),
        });
      }

      const currentUser = await tx.user.findUnique({ where: { id: user.id }, select: { userType: true } });
      if (!currentUser?.userType) {
        await tx.user.update({ where: { id: user.id }, data: { userType: 'PROVIDER' } });
      }

      return establishment;
    });

    return NextResponse.json({
      success: true,
      slug: result.slug,
      message: 'Votre profil prestataire a été soumis avec succès ! Il sera visible après validation par notre équipe.',
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Un établissement avec ce nom existe déjà. Modifiez le nom et réessayez.' },
        { status: 409 }
      );
    }
    logger.error('Erreur soumission prestataire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la soumission' },
      { status: 500 }
    );
  }
}
