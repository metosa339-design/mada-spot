'use client';

import {
  Wifi,
  Car,
  Zap,
  Truck,
  ShoppingBag,
  Calendar,
  CreditCard,
  Music,
  Cigarette,
  Baby,
  Dog,
  Accessibility,
  Utensils,
  Waves,
  Dumbbell,
  Wind,
  Tv,
} from 'lucide-react';

interface ServiceIconsProps {
  services: {
    hasWifi?: boolean;
    hasParking?: boolean;
    hasGenerator?: boolean;
    hasDelivery?: boolean;
    hasTakeaway?: boolean;
    hasReservation?: boolean;
    hasMobileMoney?: boolean;
    hasLiveMusic?: boolean;
    hasSmokingArea?: boolean;
    isChildFriendly?: boolean;
    isPetFriendly?: boolean;
    isAccessible?: boolean;
    hasRestaurant?: boolean;
    hasPool?: boolean;
    hasSpa?: boolean;
    hasAC?: boolean;
    hasTv?: boolean;
  };
  variant?: 'grid' | 'inline' | 'minimal';
}

const serviceConfig: Record<string, { icon: any; label: string }> = {
  hasWifi: { icon: Wifi, label: 'WiFi' },
  hasParking: { icon: Car, label: 'Parking' },
  hasGenerator: { icon: Zap, label: 'Groupe électrogène' },
  hasDelivery: { icon: Truck, label: 'Livraison' },
  hasTakeaway: { icon: ShoppingBag, label: 'À emporter' },
  hasReservation: { icon: Calendar, label: 'Réservation' },
  hasMobileMoney: { icon: CreditCard, label: 'Mobile Money' },
  hasLiveMusic: { icon: Music, label: 'Musique live' },
  hasSmokingArea: { icon: Cigarette, label: 'Espace fumeur' },
  isChildFriendly: { icon: Baby, label: 'Enfants bienvenus' },
  isPetFriendly: { icon: Dog, label: 'Animaux acceptés' },
  isAccessible: { icon: Accessibility, label: 'Accessible PMR' },
  hasRestaurant: { icon: Utensils, label: 'Restaurant' },
  hasPool: { icon: Waves, label: 'Piscine' },
  hasSpa: { icon: Dumbbell, label: 'Spa' },
  hasAC: { icon: Wind, label: 'Climatisation' },
  hasTv: { icon: Tv, label: 'TV' },
};

export default function ServiceIcons({ services, variant = 'grid' }: ServiceIconsProps) {
  const activeServices = Object.entries(services)
    .filter(([, value]) => value === true)
    .map(([key]) => serviceConfig[key])
    .filter(Boolean);

  if (activeServices.length === 0) return null;

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {activeServices.map(({ icon: Icon, label }) => (
          <div key={label} title={label}>
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {activeServices.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Default: grid
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {activeServices.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 p-2.5 bg-[#12121a] rounded-lg"
        >
          <Icon className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] text-slate-500 text-center leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}
