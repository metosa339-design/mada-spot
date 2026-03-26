'use client';

import { motion } from 'framer-motion';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedGradientText({ children, className = '' }: AnimatedGradientTextProps) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-[length:200%_auto] ${className}`}
      animate={{
        backgroundPosition: ['0% center', '200% center'],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% auto',
      }}
    >
      {children}
    </motion.span>
  );
}

// Version avec effet de brillance
export function ShinyText({ children, className = '' }: AnimatedGradientTextProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">
        {children}
      </span>
      <motion.span
        className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-transparent via-white/80 to-transparent"
        animate={{
          backgroundPosition: ['-200% center', '200% center'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 1,
        }}
        style={{
          backgroundSize: '200% auto',
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// Texte avec dégradé Mada (orange/vert)
export function MadaGradientText({ children, className = '' }: AnimatedGradientTextProps) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-emerald-500 to-orange-500 ${className}`}
      animate={{
        backgroundPosition: ['0% center', '100% center', '0% center'],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        backgroundSize: '200% auto',
      }}
    >
      {children}
    </motion.span>
  );
}
