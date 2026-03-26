'use client';

import { useState, useCallback } from 'react';
import { Star, AlertCircle, CheckCircle } from 'lucide-react';
import { useCsrf } from '@/hooks/useCsrf';
import ReviewPhotoUpload from './ReviewPhotoUpload';

interface ReviewFormProps {
  establishmentId: string;
  onReviewSubmitted?: () => void;
  bookingId?: string;
}

export default function ReviewForm({
  establishmentId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { csrfToken, csrfLoading } = useCsrf();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleImagesChange = useCallback((urls: string[]) => {
    setImages(urls);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    if (!comment || comment.length < 10) {
      setError('Le commentaire doit contenir au moins 10 caractères');
      return;
    }

    if (!csrfToken) {
      setError('Token de sécurité manquant. Veuillez rafraîchir la page.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/establishments/${establishmentId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          csrfToken,
          rating,
          title: title || undefined,
          comment,
          authorName: authorName || undefined,
          images: images.length > 0 ? images : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la publication');
      }

      setSuccess(true);
      setRating(0);
      setTitle('');
      setComment('');
      setAuthorName('');
      setImages([]);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <p className="text-white font-semibold text-lg">Merci pour votre avis !</p>
          <p className="text-slate-400 text-sm text-center">
            Votre avis a été publié avec succès.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-2 px-4 py-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            Écrire un autre avis
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36] space-y-5"
    >
      <h3 className="text-lg font-bold text-white">Laisser un avis</h3>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Votre note *
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 ${
                    starValue <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-600'
                  } transition-colors`}
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm text-slate-400">{rating}/5</span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-slate-300 mb-1.5">
          Titre (optionnel)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre expérience"
          maxLength={100}
          className="w-full px-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-slate-300 mb-1.5">
          Votre avis *
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience (min. 10 caractères)"
          rows={4}
          className="w-full px-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        <p className="mt-1 text-xs text-slate-500">{comment.length}/10 caractères minimum</p>
      </div>

      {/* Author Name */}
      <div>
        <label htmlFor="review-author" className="block text-sm font-medium text-slate-300 mb-1.5">
          Votre nom (optionnel)
        </label>
        <input
          id="review-author"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Nom affiché avec votre avis"
          maxLength={50}
          className="w-full px-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Photo Upload */}
      {csrfToken && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Photos (optionnel)
          </label>
          <ReviewPhotoUpload
            onImagesChange={handleImagesChange}
            maxPhotos={3}
            csrfToken={csrfToken}
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || csrfLoading || rating === 0}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isSubmitting ? 'Publication en cours...' : 'Publier mon avis'}
      </button>
    </form>
  );
}
