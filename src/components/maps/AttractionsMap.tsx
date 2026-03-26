'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Star, Navigation } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image-url';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Attraction {
  id: string;
  name: string;
  slug: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  attractionType: string;
  isFree: boolean;
  entryFeeLocal?: number;
  shortDescription?: string;
  coverImage?: string;
}

interface AttractionsMapProps {
  attractions?: Attraction[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Custom icon based on attraction type
const getMarkerIcon = (type: string) => {
  const colors: Record<string, string> = {
    parc_national: '#22C55E',
    ile: '#3B82F6',
    ville: '#F59E0B',
    plage: '#06B6D4',
    montagne: '#8B5CF6',
    reserve: '#10B981',
    nature: '#14B8A6',
    monument_naturel: '#EAB308',
  };

  const color = colors[type] || '#6B7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg)">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to fit bounds when attractions change
function FitBounds({ attractions }: { attractions: Attraction[] }) {
  const map = useMap();

  useEffect(() => {
    if (attractions && attractions.length > 0) {
      const bounds = L.latLngBounds(
        attractions.map((a) => [a.latitude, a.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [attractions, map]);

  return null;
}

export default function AttractionsMap({
  attractions: initialAttractions,
  center = [-18.8792, 47.5079], // Antananarivo par défaut
  zoom = 6,
  className = 'h-[500px] w-full',
}: AttractionsMapProps) {
  const [attractions, setAttractions] = useState<Attraction[]>(initialAttractions || []);
  const [isLoading, setIsLoading] = useState(!initialAttractions);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!initialAttractions) {
      const fetchAttractions = async () => {
        try {
          const res = await fetch('/api/bons-plans/attractions?limit=100');
          if (res.ok) {
            const data = await res.json();
            setAttractions(data.attractions || []);
          }
        } catch (error) {
          console.error('Error fetching attractions:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAttractions();
    }
  }, [initialAttractions]);

  if (!isMounted) {
    return (
      <div className={`${className} bg-slate-100 rounded-2xl flex items-center justify-center`}>
        <div className="text-slate-500">Chargement de la carte...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className} bg-slate-100 rounded-2xl flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <MapPin className="w-8 h-8 text-slate-400 animate-bounce" />
          <div className="text-slate-500">Chargement des destinations...</div>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    parc_national: 'Parc National',
    ile: 'Île',
    ville: 'Ville',
    plage: 'Plage',
    montagne: 'Montagne',
    reserve: 'Réserve',
    nature: 'Nature',
    monument_naturel: 'Monument Naturel',
  };

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {attractions.length > 0 && <FitBounds attractions={attractions} />}

        {attractions.map((attraction) => (
          <Marker
            key={attraction.id}
            position={[attraction.latitude, attraction.longitude]}
            icon={getMarkerIcon(attraction.attractionType)}
          >
            <Popup className="custom-popup" minWidth={250}>
              <div className="p-2">
                {/* Image */}
                {attraction.coverImage && (
                  <div className="relative h-32 -mx-2 -mt-2 mb-3 rounded-t-lg overflow-hidden">
                    <img
                      src={getImageUrl(attraction.coverImage)}
                      alt={attraction.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium">
                      {typeLabels[attraction.attractionType] || attraction.attractionType}
                    </div>
                  </div>
                )}

                {/* Content */}
                <h3 className="font-bold text-slate-900 mb-1 text-base">
                  {attraction.name}
                </h3>

                <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {attraction.city}, {attraction.district}
                </div>

                {attraction.shortDescription && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {attraction.shortDescription}
                  </p>
                )}

                {/* Rating & Price */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-sm">{attraction.rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-500">({attraction.reviewCount})</span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600">
                    {attraction.isFree
                      ? 'Gratuit'
                      : `${attraction.entryFeeLocal?.toLocaleString() || '—'} Ar`}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/bons-plans/attractions/${attraction.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Voir les détails
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
