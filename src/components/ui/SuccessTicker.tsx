'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Users, MapPin, Zap } from 'lucide-react';

interface TickerItem {
  id: number;
  type: 'mission' | 'newPro' | 'booking';
  message: string;
  location?: string;
  time: string;
}

const generateTickerItems = (): TickerItem[] => [
  {
    id: 1,
    type: 'booking',
    message: 'Reservation hotel confirmee',
    location: 'Nosy Be',
    time: 'il y a 3 min',
  },
  {
    id: 2,
    type: 'newPro',
    message: 'Nouveau restaurant a rejoint Mada Spot',
    location: 'Antananarivo',
    time: 'il y a 8 min',
  },
  {
    id: 3,
    type: 'mission',
    message: 'Flash Deal active : -30% sur un hotel',
    location: 'Diego Suarez',
    time: 'il y a 12 min',
  },
  {
    id: 4,
    type: 'booking',
    message: 'Excursion reservee au Parc Isalo',
    location: 'Fianarantsoa',
    time: 'il y a 15 min',
  },
  {
    id: 5,
    type: 'newPro',
    message: '3 nouveaux établissements cette semaine',
    time: 'aujourd\'hui',
  },
  {
    id: 6,
    type: 'mission',
    message: 'Avis 5 etoiles pour un guide touristique',
    location: 'Antsirabe',
    time: 'il y a 22 min',
  },
];

const icons = {
  mission: CheckCircle,
  newPro: Users,
  booking: Zap,
};

const colors = {
  mission: 'text-green-500',
  newPro: 'text-blue-500',
  booking: 'text-orange-500',
};

export default function SuccessTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items] = useState(generateTickerItems);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  const currentItem = items[currentIndex];
  const Icon = icons[currentItem.type];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-2 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 text-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Icon className={`w-4 h-4 ${colors[currentItem.type]}`} />
            </motion.div>

            <span className="font-medium">{currentItem.message}</span>

            {currentItem.location && (
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3" />
                {currentItem.location}
              </span>
            )}

            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{currentItem.time}</span>

            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-2 w-2 h-2 bg-green-500 rounded-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
