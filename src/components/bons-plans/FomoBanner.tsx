'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock } from 'lucide-react';

interface FomoBannerProps {
  establishmentId: string;
}

export default function FomoBanner({ establishmentId }: FomoBannerProps) {
  const [data, setData] = useState<{ recentViews: number; lastBookingAgo: string | null } | null>(null);

  useEffect(() => {
    fetch(`/api/establishments/${establishmentId}/fomo`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [establishmentId]);

  if (!data || (data.recentViews === 0 && !data.lastBookingAgo)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-4"
      >
        {data.recentViews > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-medium">
              {data.recentViews} personne{data.recentViews > 1 ? 's' : ''} regarde{data.recentViews > 1 ? 'nt' : ''} en ce moment
            </span>
          </div>
        )}
        {data.lastBookingAgo && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">
              Derniere reservation il y a {data.lastBookingAgo}
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
