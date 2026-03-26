'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image-url';
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useCsrf } from '@/hooks/useCsrf';
import ReviewPhotoUpload from '@/components/bons-plans/ReviewPhotoUpload';

interface ReviewableBooking {
  id: string;
  reference: string;
  bookingType: string;
  checkIn: string;
  checkOut: string | null;
  guestName: string;
  totalPrice: number | null;
  currency: string;
  status: string;
  createdAt: string;
  establishment: {
    id: string;
    name: string;
    city: string;
    type: string;
    coverImage: string | null;
  };
  hasReview: boolean;
}

export default function BookingReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const { csrfToken, csrfLoading } = useCsrf();

  const [booking, setBooking] = useState<ReviewableBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImagesChange = useCallback((urls: string[]) => {
    setImages(urls);
  }, []);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch('/api/bookings/reviewable', { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success && data.bookings) {
          const found = data.bookings.find((b: ReviewableBooking) => b.id === bookingId);
          if (found) {
            if (found.hasReview) {
              setAlreadyReviewed(true);
            }
            setBooking(found);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Veuillez selectionner une note');
      return;
    }
    if (!comment || comment.length < 10) {
      setError('Le commentaire doit contenir au moins 10 caracteres');
      return;
    }
    if (!csrfToken) {
      setError('Token de securite manquant. Veuillez rafraichir la page.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          csrfToken,
          rating,
          title: title || undefined,
          comment,
          images: images.length > 0 ? images : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la publication');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h1 className="text-xl font-bold mb-2">Reservation introuvable</h1>
          <p className="text-gray-400 mb-6">
            Cette reservation n&apos;existe pas ou n&apos;est pas eligible pour un avis.
          </p>
          <Link
            href="/client/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a24] border border-[#2a2a36] rounded-lg text-sm text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux reservations
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-[#2a2a36] pt-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link
            href="/client/bookings"
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Mes reservations
          </Link>
          <h1 className="text-2xl font-bold text-white">Laisser un avis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Partagez votre experience pour aider la communaute
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Booking Info Card */}
        <div className="bg-[#1a1a24] rounded-xl border border-[#2a2a36] p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Cover Image */}
            {booking.establishment.coverImage && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#0c0c16]">
                <img
                  src={getImageUrl(booking.establishment.coverImage)}
                  alt={booking.establishment.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">
                {booking.establishment.name}
              </h2>
              <div className="flex items-center gap-1 text-sm text-gray-400 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {booking.establishment.city}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(booking.checkIn)}
                {booking.checkOut && ` - ${formatDate(booking.checkOut)}`}
              </div>
              <div className="mt-1 text-xs font-mono text-gray-500">
                Ref: {booking.reference}
              </div>
            </div>
          </div>

          {/* Verified badge */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <BadgeCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">Avis verifie</p>
              <p className="text-xs text-emerald-400/70">
                Cet avis sera lie a votre reservation et marque comme verifie
              </p>
            </div>
          </div>
        </div>

        {/* Already Reviewed */}
        {alreadyReviewed && (
          <div className="bg-[#1a1a24] rounded-xl border border-[#2a2a36] p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <h3 className="text-lg font-bold text-white mb-1">Avis deja publie</h3>
            <p className="text-gray-400 text-sm mb-4">
              Vous avez deja laisse un avis pour cette reservation.
            </p>
            <Link
              href="/client/bookings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#e55a2b]"
            >
              Retour aux reservations
            </Link>
          </div>
        )}

        {/* Success State */}
        {success && !alreadyReviewed && (
          <div className="bg-[#1a1a24] rounded-xl border border-[#2a2a36] p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h3 className="text-lg font-bold text-white mb-1">Merci pour votre avis !</h3>
            <p className="text-gray-400 text-sm mb-4">
              Votre avis verifie a ete publie avec succes.
            </p>
            <Link
              href="/client/bookings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#e55a2b]"
            >
              Retour aux reservations
            </Link>
          </div>
        )}

        {/* Review Form */}
        {!alreadyReviewed && !success && (
          <form
            onSubmit={handleSubmit}
            className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36] space-y-5"
          >
            <h3 className="text-lg font-bold text-white">Votre avis</h3>

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
              <label
                htmlFor="review-title"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Titre (optionnel)
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumez votre experience"
                maxLength={100}
                className="w-full px-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="review-comment"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Votre avis *
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre experience (min. 10 caracteres)"
                rows={4}
                className="w-full px-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">
                {comment.length}/10 caracteres minimum
              </p>
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
              {isSubmitting ? 'Publication en cours...' : 'Publier mon avis verifie'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
