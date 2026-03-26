import { Metadata } from 'next';
import { Flame } from 'lucide-react';
import { prisma } from '@/lib/db';
import OffresContent from './OffresContent';

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
  HOTEL: '/bons-plans/hotels/',
  RESTAURANT: '/bons-plans/restaurants/',
  ATTRACTION: '/bons-plans/attractions/',
  PROVIDER: '/bons-plans/prestataires/',
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <div className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-500/20" />
        <div className="max-w-7xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm mb-6">
            <Flame className="w-4 h-4" />
            Promotions exclusives des prestataires
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Offres du <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Moment</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Profitez des réductions flash sur les hôtels, restaurants et activités à Madagascar
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <OffresContent offres={offres} />
      </div>
    </div>
  );
}
