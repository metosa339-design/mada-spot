'use client';

import GhostBanner from '@/components/bons-plans/GhostBanner';
import { MapPin, Star, Tag, User, Calendar } from 'lucide-react';
import { useTrans } from '@/i18n';

interface LieuClientProps {
  est: any;
}

const TYPE_LABEL_KEYS: Record<string, 'typeHotel' | 'typeRestaurant' | 'typeAttraction' | 'typeProvider'> = {
  HOTEL: 'typeHotel',
  RESTAURANT: 'typeRestaurant',
  ATTRACTION: 'typeAttraction',
  PROVIDER: 'typeProvider',
};

export default function LieuClient({ est }: LieuClientProps) {
  const t = useTrans('bonsPlansLieu');

  return (
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
            {TYPE_LABEL_KEYS[est.type] ? t[TYPE_LABEL_KEYS[est.type]] : est.type}
          </span>
          {est.rating > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {est.rating.toFixed(1)} ({est.reviewCount} {t.reviewsSuffix})
            </span>
          )}
        </div>

        {est.description && (
          <p className="text-gray-400 text-sm mt-4">{est.description}</p>
        )}

        <p className="text-xs text-gray-600 mt-4 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {t.addedOn} {new Date(est.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Reviews */}
      {est.reviews.length > 0 && (
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">{t.communityReviews}</h2>
          </div>
          <div className="divide-y divide-white/5">
            {est.reviews.map((review: any) => (
              <div key={review.id} className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{review.authorName || t.traveler}</p>
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
  );
}
