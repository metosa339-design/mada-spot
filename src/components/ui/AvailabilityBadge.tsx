'use client';

import { motion } from 'framer-motion';

interface AvailabilityBadgeProps {
  isAvailable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function AvailabilityBadge({
  isAvailable = true,
  size = 'md',
  showText = true
}: AvailabilityBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (!isAvailable) {
    return (
      <span className={`inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 rounded-full font-medium ${sizeClasses[size]}`}>
        <span className={`${dotSizes[size]} bg-slate-400 rounded-full`} />
        {showText && 'Indisponible'}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 bg-green-50 text-green-700 rounded-full font-medium ${sizeClasses[size]}`}
    >
      <motion.span
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`${dotSizes[size]} bg-green-500 rounded-full`}
      />
      {showText && 'Disponible maintenant'}
    </motion.span>
  );
}

// Version compacte juste avec le point vert
export function LiveDot({ className = '' }: { className?: string }) {
  return (
    <motion.span
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0.6, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`inline-block w-2 h-2 bg-green-500 rounded-full ${className}`}
    />
  );
}
