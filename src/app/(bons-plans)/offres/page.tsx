import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import OffresContent, { OffresHero } from './OffresContent';

export const metadata: Metadata = {
  title: 'Offres du Moment | Mada Spot',
  description: 'Les meilleures promotions sur les hôtels, restaurants, activités et plus à Madagascar.',
};

const TYPE_TO_CATEGORY: Record<string, string> = {
  HOTEL: 'hotel',
  RESTAURANT: 'restaurant',
  ATTRACTION: 'attraction',
  PROVIDER: 'activite',
};

const TYPE_TO_SLUG_PREFIX: Record<string, string> = {
  HOTEL: '/hotels/',
  RESTAURANT: '/restaurants/',
  ATTRACTION: '/attractions/',
  PROVIDER: '/prestataires/',
};

async function getActivePromotions() {
  const now = new Date();

  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      establishment: { isActive: true },
    },
    include: {
      establishment: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          shortDescription: true,
          description: true,
        },
      },
    },
    orderBy: { endDate: 'asc' },
    take: 30,
  });

  // Enrich with prices from type-specific tables
  const enriched = await Promise.all(
    promotions.map(async (p) => {
      let priceFrom: number | null = null;

      try {
        if (p.establishment.type === 'HOTEL') {
          const cheapestRoom = await prisma.roomType.findFirst({
            where: { hotel: { establishmentId: p.establishment.id }, isAvailable: true },
            orderBy: { pricePerNight: 'asc' },
            select: { pricePerNight: true },
          });
          priceFrom = cheapestRoom?.pricePerNight ?? null;
        } else if (p.establishment.type === 'RESTAURANT') {
          const restaurant = await prisma.restaurant.findUnique({
            where: { establishmentId: p.establishment.id },
            select: { avgMainCourse: true },
          });
          priceFrom = restaurant?.avgMainCourse ?? null;
        } else if (p.establishment.type === 'ATTRACTION') {
          const attraction = await prisma.attraction.findUnique({
            where: { establishmentId: p.establishment.id },
            select: { entryFeeForeign: true },
          });
          priceFrom = attraction?.entryFeeForeign ?? null;
        } else if (p.establishment.type === 'PROVIDER') {
          const provider = await prisma.provider.findUnique({
            where: { establishmentId: p.establishment.id },
            select: { priceFrom: true },
          });
          priceFrom = provider?.priceFrom ?? null;
        }
      } catch {
        // Non-critical
      }

      return {
        id: p.id,
        title: p.establishment.name,
        slug: p.establishment.slug,
        description: p.establishment.shortDescription || p.establishment.description?.slice(0, 120) || '',
        location: p.establishment.city,
        category: TYPE_TO_CATEGORY[p.establishment.type] || 'activite',
        image: p.establishment.coverImage || '',
        rating: p.establishment.rating,
        reviewCount: p.establishment.reviewCount,
        price: priceFrom,
        href: `${TYPE_TO_SLUG_PREFIX[p.establishment.type] || '/bons-plans/'}${p.establishment.slug}`,
        // Promotion-specific fields
        promoTitle: p.title,
        discountPercent: p.discountPercent,
        endDate: p.endDate.toISOString(),
        establishmentName: p.establishment.name,
        discountedPrice: priceFrom && p.discountPercent > 0
          ? Math.round(priceFrom * (1 - p.discountPercent / 100))
          : null,
      };
    })
  );

  return enriched;
}

export default async function OffresPage() {
  const offres = await getActivePromotions();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#FAFAFA]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <OffresHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <OffresContent offres={offres} />
      </div>
    </div>
  );
}
