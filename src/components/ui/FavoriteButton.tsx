'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  providerId: string;
  initialState?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'floating';
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({
  providerId,
  initialState = false,
  size = 'md',
  variant = 'default',
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFloatingHearts, setShowFloatingHearts] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    default: 'bg-[#1a1a24] border border-[#2a2a36] hover:border-rose-300',
    card: 'bg-[#1a1a24]/90 backdrop-blur-sm shadow-md hover:shadow-lg',
    floating: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
  };

  const handleToggle = useCallback(async () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    setIsAnimating(true);

    // Show floating hearts when adding to favorites
    if (newState) {
      setShowFloatingHearts(true);
      setTimeout(() => setShowFloatingHearts(false), 1000);
    }

    // Reset animation
    setTimeout(() => setIsAnimating(false), 800);

    // API call to toggle favorite
    try {
      const res = await fetch('/api/client/favorites', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });

      if (!res.ok) {
        // Revert on error
        setIsFavorite(!newState);
      } else {
        onToggle?.(newState);
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(!newState);
      console.error('Error toggling favorite:', error);
    }
  }, [isFavorite, providerId, onToggle]);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center transition-all duration-300`}
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <motion.div
          animate={isAnimating ? { scale: [1, 1.3, 1, 1.2, 1] } : {}}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Heart
            className={`${iconSizes[size]} transition-all duration-300 ${
              isFavorite
                ? 'text-rose-500 fill-rose-500'
                : variant === 'floating'
                ? 'text-white'
                : 'text-slate-400'
            }`}
          />
        </motion.div>
      </motion.button>

      {/* Floating hearts animation */}
      <AnimatePresence>
        {showFloatingHearts && (
          <>
            {[...Array(5)].map((_, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 1,
                  scale: 0.5,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: (Math.random() - 0.5) * 60,
                  y: -40 - Math.random() * 30,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <Heart
                  className={`w-4 h-4 text-rose-500 fill-rose-500`}
                  style={{
                    filter: `hue-rotate(${Math.random() * 30}deg)`,
                  }}
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Pulse ring effect */}
      <AnimatePresence>
        {isAnimating && isFavorite && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full border-2 border-rose-400 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
