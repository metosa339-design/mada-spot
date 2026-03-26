'use client';

import EstablishmentBentoCard from './EstablishmentBentoCard';

interface BentoEstablishment {
  id: string;
  type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
  name: string;
  slug: string;
  coverImage?: string | null;
  city: string;
  district?: string | null;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  priceIndicator?: string | null;
  category?: string | null;
  subtype?: string | null;
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
}

interface BentoGridProps {
  establishments: BentoEstablishment[];
  columns?: 2 | 3 | 4;
}

export default function BentoGrid({ establishments, columns = 3 }: BentoGridProps) {
  if (establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun établissement trouvé</p>
      </div>
    );
  }

  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${colClass[columns]} gap-4`}>
      {establishments.map((est, index) => {
        // First featured item gets large size
        const size = est.isFeatured && index < 2 ? 'large' : 'medium';

        return (
          <EstablishmentBentoCard
            key={est.id}
            establishment={est}
            size={size}
          />
        );
      })}
    </div>
  );
}
