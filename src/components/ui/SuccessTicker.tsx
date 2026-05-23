'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Users, MapPin, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TickerItem {
  id: number;
  type: 'mission' | 'newPro' | 'booking';
  messageFr: string;
  messageEn: string;
  locationFr?: string;
  locationEn?: string;
  timeFr: string;
  timeEn: string;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: 1,
    type: 'newPro',
    messageFr: 'Referencez votre activite GRATUITEMENT et soyez visible a l\'international',
    messageEn: 'List your business FOR FREE and reach international travelers',
    timeFr: 'Inscription gratuite',
    timeEn: 'Free signup',
  },
  {
    id: 2,
    type: 'booking',
    messageFr: 'Reservation hotel confirmee',
    messageEn: 'Hotel booking confirmed',
    locationFr: 'Nosy Be',
    locationEn: 'Nosy Be',
    timeFr: 'il y a 3 min',
    timeEn: '3 min ago',
  },
  {
    id: 3,
    type: 'mission',
    messageFr: '+500 voyageurs decouvrent Madagascar chaque jour sur Mada Spot',
    messageEn: '+500 travelers discover Madagascar every day on Mada Spot',
    timeFr: 'en direct',
    timeEn: 'live',
  },
  {
    id: 4,
    type: 'newPro',
    messageFr: 'Nouveau restaurant a rejoint Mada Spot',
    messageEn: 'New restaurant joined Mada Spot',
    locationFr: 'Antananarivo',
    locationEn: 'Antananarivo',
    timeFr: 'il y a 8 min',
    timeEn: '8 min ago',
  },
  {
    id: 5,
    type: 'booking',
    messageFr: 'Votre hotel, restaurant ou activite merite d\'etre connu — inscrivez-vous maintenant',
    messageEn: 'Your hotel, restaurant or activity deserves to be seen — sign up now',
    timeFr: '100% gratuit',
    timeEn: '100% free',
  },
  {
    id: 6,
    type: 'mission',
    messageFr: 'Flash Deal active : -30% sur un hotel',
    messageEn: 'Flash Deal active: -30% on a hotel',
    locationFr: 'Diego Suarez',
    locationEn: 'Diego Suarez',
    timeFr: 'il y a 12 min',
    timeEn: '12 min ago',
  },
  {
    id: 7,
    type: 'newPro',
    messageFr: 'Rejoignez +175 etablissements deja references sur Mada Spot',
    messageEn: 'Join +175 businesses already listed on Mada Spot',
    timeFr: 'aujourd\'hui',
    timeEn: 'today',
  },
  {
    id: 8,
    type: 'booking',
    messageFr: 'Excursion reservee au Parc Isalo',
    messageEn: 'Excursion booked at Isalo Park',
    locationFr: 'Fianarantsoa',
    locationEn: 'Fianarantsoa',
    timeFr: 'il y a 15 min',
    timeEn: '15 min ago',
  },
  {
    id: 9,
    type: 'mission',
    messageFr: 'Boostez votre visibilite — des touristes du monde entier vous cherchent',
    messageEn: 'Boost your visibility — travelers from around the world are looking for you',
    timeFr: 'en ce moment',
    timeEn: 'right now',
  },
  {
    id: 10,
    type: 'newPro',
    messageFr: '3 nouveaux etablissements cette semaine',
    messageEn: '3 new businesses this week',
    timeFr: 'aujourd\'hui',
    timeEn: 'today',
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
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentItem = TICKER_ITEMS[currentIndex];
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

            <span className="font-medium">{t(currentItem.messageFr, currentItem.messageEn)}</span>

            {currentItem.locationFr && (
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3" />
                {t(currentItem.locationFr, currentItem.locationEn)}
              </span>
            )}

            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{t(currentItem.timeFr, currentItem.timeEn)}</span>

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
