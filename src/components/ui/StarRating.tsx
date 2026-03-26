'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = useCallback((starIndex: number) => {
    if (!interactive || !onRate) return;

    setIsAnimating(starIndex);
    onRate(starIndex);

    // Reset animation after delay
    setTimeout(() => setIsAnimating(null), 600);
  }, [interactive, onRate]);

  const handleMouseEnter = useCallback((starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    if (interactive) {
      setHoverRating(null);
    }
  }, [interactive]);

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {[...Array(maxRating)].map((_, index) => {
          const starIndex = index + 1;
          const isFilled = starIndex <= displayRating;
          const isHalfFilled = !isFilled && starIndex - 0.5 <= displayRating;
          const isCurrentAnimating = isAnimating === starIndex;

          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              disabled={!interactive}
              className={`relative ${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
              whileHover={interactive ? { scale: 1.2 } : {}}
              whileTap={interactive ? { scale: 0.9 } : {}}
              animate={isCurrentAnimating ? {
                scale: [1, 1.4, 1, 1.2, 1],
                rotate: [0, -10, 10, -5, 0],
              } : {}}
              transition={{ duration: 0.5 }}
              aria-label={`${starIndex} sur ${maxRating} étoiles`}
            >
              {/* Background star (empty) */}
              <Star
                className={`${sizeClasses[size]} text-slate-300 transition-colors duration-200`}
              />

              {/* Filled star overlay */}
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{
                  clipPath: isFilled
                    ? 'inset(0 0 0 0)'
                    : isHalfFilled
                      ? 'inset(0 50% 0 0)'
                      : 'inset(0 100% 0 0)',
                }}
                transition={{ duration: 0.2 }}
              >
                <Star
                  className={`${sizeClasses[size]} text-amber-400 fill-amber-400`}
                />
              </motion.div>

              {/* Sparkle effect on click */}
              {isCurrentAnimating && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-400 rounded-full"
                      initial={{
                        opacity: 1,
                        scale: 0,
                        x: '50%',
                        y: '50%',
                      }}
                      animate={{
                        opacity: 0,
                        scale: 1,
                        x: `${50 + Math.cos(i * 60 * Math.PI / 180) * 150}%`,
                        y: `${50 + Math.sin(i * 60 * Math.PI / 180) * 150}%`,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Rating value */}
      {showValue && (
        <span className="font-semibold text-slate-900">
          {rating.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {reviewCount !== undefined && (
        <span className="text-sm text-slate-500">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
