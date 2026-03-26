'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Clock } from 'lucide-react';

interface Promo {
  title: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

interface PromoBannerProps {
  establishmentId: string;
}

function getTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Expire';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}j ${hours}h restant${days > 1 ? 's' : ''}`;
  return `${hours}h restante${hours > 1 ? 's' : ''}`;
}

export default function PromoBanner({ establishmentId }: PromoBannerProps) {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    fetch(`/api/establishments/${establishmentId}/promotions`)
      .then((r) => r.json())
      .then((d) => setPromos(d.promotions || []))
      .catch(() => {});
  }, [establishmentId]);

  if (promos.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 space-y-3"
      >
        {promos.map((promo, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/15 to-orange-500/15 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    -{promo.discountPercent}%
                  </span>
                  <span className="text-sm font-semibold text-white truncate">
                    {promo.title}
                  </span>
                </div>
                {promo.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{promo.description}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-orange-300">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeLeft(promo.endDate)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
