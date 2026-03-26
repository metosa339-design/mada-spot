'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Star, BadgeCheck } from 'lucide-react';
import ReviewImageGallery from './ReviewImageGallery';

interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  ownerResponse?: string;
  isVerified?: boolean;
  images?: string;
}

interface ReviewPreviewProps {
  reviews: ReviewItem[];
  maxReviews?: number;
  rating: number;
  reviewCount: number;
  establishmentId?: string;
}

export default memo(function ReviewPreview({
  reviews,
  maxReviews = 2,
  rating,
  reviewCount,
  establishmentId,
}: ReviewPreviewProps) {
  if (!reviews || reviews.length === 0) return null;

  const displayedReviews = reviews
    .filter((r) => r.comment && r.comment.length > 0)
    .slice(0, maxReviews);

  if (displayedReviews.length === 0) return null;

  return (
    <div className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Avis clients ({reviewCount})
        </h2>
        <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-yellow-400">{rating?.toFixed(1)}</span>
        </div>
      </div>

      {/* Rating distribution */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-[#2a2a36]/50 rounded-xl">
          <div className="text-center flex-shrink-0">
            <p className="text-3xl font-bold text-white">{rating?.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{reviewCount} avis</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-3 text-right">{star}</span>
                  <div className="flex-1 h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {displayedReviews.map((review) => (
          <div key={review.id} className="border-b border-[#2a2a36] pb-5 last:border-0 last:pb-0">
            <div className="flex items-start gap-3">
              {/* Avatar initiale */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(review.authorName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-white text-sm">{review.authorName}</p>
                      {review.isVerified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-medium border border-emerald-500/20">
                          <BadgeCheck className="w-2.5 h-2.5" />
                          Vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.title && (
                  <p className="font-medium text-white mt-1.5 text-sm">{review.title}</p>
                )}
                <p className="text-slate-300 mt-1 text-sm leading-relaxed">{review.comment}</p>
                {(() => {
                  if (!review.images) return null;
                  let parsedImages: string[];
                  try {
                    parsedImages = typeof review.images === 'string' ? JSON.parse(review.images) : review.images;
                  } catch {
                    return null;
                  }
                  if (!Array.isArray(parsedImages) || parsedImages.length === 0) return null;
                  return <ReviewImageGallery images={parsedImages} />;
                })()}
                {review.ownerResponse && (
                  <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border-l-2 border-orange-500">
                    <p className="text-xs font-medium text-orange-300 mb-1">
                      Réponse de l'établissement
                    </p>
                    <p className="text-xs text-orange-200">{review.ownerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviewCount > maxReviews && establishmentId && (
        <Link
          href={`/bons-plans/avis/${establishmentId}`}
          className="mt-4 w-full py-2.5 border border-[#2a2a36] text-slate-300 font-medium text-sm rounded-xl hover:bg-[#2a2a36] transition-colors block text-center"
        >
          Voir tous les {reviewCount} avis
        </Link>
      )}
    </div>
  );
});
