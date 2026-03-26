'use client';

import { useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  successIcon?: ReactNode;
  successMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showSuccess?: boolean;
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  successIcon,
  successMessage,
  loading = false,
  disabled = false,
  className = '',
  showSuccess = true,
}: AnimatedButtonProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-7 py-3.5 text-lg',
  };

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);

    // Handle async onClick
    if (onClick) {
      try {
        setIsLoading(true);
        await onClick();
        if (showSuccess) {
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 2000);
        }
      } catch (error) {
        console.error('Button action failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onClick, disabled, isLoading, showSuccess]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative overflow-hidden rounded-xl font-medium transition-all duration-300
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className={`absolute rounded-full pointer-events-none ${
            variant === 'primary' || variant === 'danger'
              ? 'bg-white/30'
              : 'bg-slate-400/30'
          }`}
          style={{ left: ripple.x, top: ripple.y }}
          initial={{ width: 0, height: 0, x: '-50%', y: '-50%' }}
          animate={{ width: 300, height: 300 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* Button content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement...</span>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-2"
          >
            {successIcon || <Check className="w-5 h-5" />}
            <span>{successMessage || 'Succès !'}</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-2"
          >
            {icon}
            <span>{children}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
