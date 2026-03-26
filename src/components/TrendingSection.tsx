'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, TrendingUp, Hotel, UtensilsCrossed, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image-url';

interface TrendingItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  coverImage: string | null;
  rating: number | null;
  reviewCount: number;
  priceRange: string | null;
  isFeatured: boolean;
  shortDescription: string | null;
  url: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  HOTEL: { label: 'Hôtel', icon: Hotel, color: 'bg-blue-100 text-blue-700' },
  RESTAURANT: { label: 'Restaurant', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700' },
  ATTRACTION: { label: 'Attraction', icon: Compass, color: 'bg-green-100 text-green-700' },
};

export default function TrendingSection() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending?limit=6')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.trending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900">Tendances</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.ATTRACTION;
            const TypeIcon = typeConf.icon;

            return (
              <Link
                key={item.id}
                href={item.url}
                className="group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-40 bg-gray-200">
                  {item.coverImage ? (
                    <Image
                      src={getImageUrl(item.coverImage)}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <TypeIcon className="w-12 h-12" />
                    </div>
                  )}
                  {item.isFeatured && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                      Recommandé
                    </span>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConf.color}`}>
                    {typeConf.label}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {item.city}
                  </div>
                  {item.shortDescription && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.shortDescription}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    {item.rating ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{item.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">({item.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Pas encore noté</span>
                    )}
                    {item.priceRange && (
                      <span className="text-xs text-gray-500">{item.priceRange}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
