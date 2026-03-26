import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SITE_NAME } from '@/lib/constants';
import GhostBanner from '@/components/bons-plans/GhostBanner';
import { MapPin, Star, Tag, User, Calendar } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getGhostEstablishment(slug: string) {
  const establishment = await prisma.establishment.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      city: true,
      region: true,
      description: true,
      rating: true,
      reviewCount: true,
      isGhost: true,
      isClaimed: true,
      createdAt: true,
      reviews: {
        where: { isPublished: true },
        select: {
          id: true,
          authorName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!establishment || !establishment.isGhost) return null;
  return establishment;
}

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hôtel / Hébergement',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction / Loisir',
  PROVIDER: 'Prestataire de service',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const est = await getGhostEstablishment(slug);

  if (!est) {
    return { title: `Lieu introuvable | ${SITE_NAME}` };
  }

  return {
    title: `${est.name} — ${est.city} | ${SITE_NAME}`,
    description: `Fiche communautaire pour ${est.name} à ${est.city}. Ajouté par la communauté Mada Spot.`,
    robots: { index: false, follow: false },
  };
}

export default async function GhostLieuPage({ params }: Props) {
  const { slug } = await params;
  const est = await getGhostEstablishment(slug);

  if (!est) notFound();

  return (
    <div className="min-h-screen bg-[#0c0c16] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Ghost Banner */}
        <GhostBanner isClaimed={est.isClaimed} establishmentId={est.id} />

        {/* Establishment Info */}
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-3">{est.name}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-violet-400" />
              {est.city}{est.region ? `, ${est.region}` : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-violet-400" />
              {TYPE_LABELS[est.type] || est.type}
            </span>
            {est.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {est.rating.toFixed(1)} ({est.reviewCount} avis)
              </span>
            )}
          </div>

          {est.description && (
            <p className="text-gray-400 text-sm mt-4">{est.description}</p>
          )}

          <p className="text-xs text-gray-600 mt-4 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Ajouté le {new Date(est.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Reviews */}
        {est.reviews.length > 0 && (
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Avis de la communauté</h2>
            </div>
            <div className="divide-y divide-white/5">
              {est.reviews.map(review => (
                <div key={review.id} className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{review.authorName || 'Voyageur'}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
