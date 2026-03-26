'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getImageUrl } from '@/lib/image-url';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapMarker {
  id: string;
  type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER';
  name: string;
  slug?: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  coverImage?: string | null;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  priceIndicator?: string | null;
  subtype?: string | null;
}

interface InteractiveFullMapProps {
  markers: MapMarker[];
  selectedMarker?: MapMarker | null;
  onMarkerClick?: (marker: MapMarker | null) => void;
}

// Custom marker icons
const createMarkerIcon = (type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER', isSelected: boolean = false) => {
  const colors: Record<string, { bg: string; icon: string }> = {
    HOTEL: { bg: '#3B82F6', icon: '🏨' },
    RESTAURANT: { bg: '#F97316', icon: '🍽️' },
    ATTRACTION: { bg: '#10B981', icon: '🏝️' },
    PROVIDER: { bg: '#06B6D4', icon: '🧑‍💼' },
  };

  const { bg, icon } = colors[type];
  const size = isSelected ? 44 : 36;
  const scale = isSelected ? 1.2 : 1;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${bg};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) scale(${scale});
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <span style="transform: rotate(45deg); font-size: ${isSelected ? 20 : 16}px;">${icon}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Component to handle selected marker
function SelectedMarkerHandler({ selectedMarker }: { selectedMarker: MapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedMarker) {
      map.setView([selectedMarker.latitude, selectedMarker.longitude], map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedMarker, map]);

  return null;
}

// Component to fit bounds on initial load
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const [hasFitted, setHasFitted] = useState(false);

  useEffect(() => {
    if (markers.length > 0 && !hasFitted) {
      const bounds = L.latLngBounds(
        markers.map((m) => [m.latitude, m.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      setHasFitted(true);
    }
  }, [markers, map, hasFitted]);

  return null;
}

// Marker clustering component
function MarkerClusterGroup({
  markers,
  selectedMarker,
  onMarkerClick,
}: {
  markers: MapMarker[];
  selectedMarker: MapMarker | null;
  onMarkerClick?: (marker: MapMarker | null) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import of markercluster
    import('leaflet.markercluster').then(() => {
      // Remove old cluster group
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }

      const clusterGroup = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count >= 50) size = 'large';
          else if (count >= 10) size = 'medium';

          const sizeMap = { small: 40, medium: 50, large: 60 };
          const s = sizeMap[size as keyof typeof sizeMap];

          return L.divIcon({
            html: `<div style="
              background: linear-gradient(135deg, #ff6b35, #ff1493);
              width: ${s}px;
              height: ${s}px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size === 'large' ? 16 : 14}px;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(s, s),
          });
        },
      });

      markers.forEach((marker) => {
        const leafletMarker = L.marker([marker.latitude, marker.longitude], {
          icon: createMarkerIcon(marker.type, selectedMarker?.id === marker.id),
        });

        // Create popup content
        const popupContent = createPopupContent(marker);
        leafletMarker.bindPopup(popupContent, { minWidth: 280, maxWidth: 320 });

        leafletMarker.on('click', () => {
          onMarkerClick?.(marker);
        });

        clusterGroup.addLayer(leafletMarker);
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    });

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [markers, map, selectedMarker, onMarkerClick]);

  return null;
}

// Create popup HTML content
function createPopupContent(marker: MapMarker): string {
  const detailUrl = `${typeHrefs[marker.type]}/${marker.slug}`;

  const imageSection = marker.coverImage
    ? `<div style="position:relative;height:120px;margin:-12px -12px 12px;overflow:hidden;border-radius:12px 12px 0 0;">
        <img src="${getImageUrl(marker.coverImage)}" alt="${marker.name}"
             style="width:100%;height:100%;object-fit:cover;"
             onerror="this.style.display='none'" />
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.5),transparent);"></div>
        <div style="position:absolute;top:8px;left:8px;display:flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.9);border-radius:20px;font-size:11px;font-weight:500;">
          ${typeLabels[marker.type]}
        </div>
      </div>`
    : `<div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;padding:4px 8px;background:#f1f5f9;border-radius:20px;font-size:11px;font-weight:500;width:fit-content;">
        ${typeLabels[marker.type]}
      </div>`;

  const priceSection = marker.priceIndicator
    ? `<div style="font-size:13px;font-weight:600;color:#10b981;">${marker.priceIndicator}</div>`
    : '';

  return `
    <div style="padding:12px;font-family:system-ui,-apple-system,sans-serif;">
      ${imageSection}
      <h3 style="font-weight:700;color:#0f172a;margin-bottom:4px;font-size:15px;">
        ${marker.name}
      </h3>
      <div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#64748b;margin-bottom:8px;">
        📍 ${marker.city}${marker.district ? ', ' + marker.district : ''}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="color:#f59e0b;">⭐</span>
          <span style="font-weight:600;font-size:13px;">${marker.rating.toFixed(1)}</span>
          <span style="font-size:12px;color:#94a3b8;">(${marker.reviewCount} avis)</span>
        </div>
        ${priceSection}
      </div>
      <a href="${detailUrl}"
         style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:10px;background:#10b981;color:white;font-size:13px;font-weight:500;border-radius:8px;text-decoration:none;transition:opacity 0.2s;"
         onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
        Voir les détails
      </a>
    </div>
  `;
}

const typeLabels: Record<string, string> = {
  HOTEL: '🏨 Hôtel',
  RESTAURANT: '🍽️ Restaurant',
  ATTRACTION: '🏝️ Attraction',
  PROVIDER: '🧑‍💼 Prestataire',
};

const typeHrefs: Record<string, string> = {
  HOTEL: '/bons-plans/hotels',
  RESTAURANT: '/bons-plans/restaurants',
  ATTRACTION: '/bons-plans/attractions',
  PROVIDER: '/bons-plans/prestataires',
};

export default function InteractiveFullMap({
  markers,
  selectedMarker,
  onMarkerClick,
}: InteractiveFullMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validMarkers = useMemo(
    () => markers.filter((m) => m.latitude && m.longitude),
    [markers]
  );

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Chargement de la carte...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[-18.8792, 47.5079]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validMarkers.length > 0 && <FitBounds markers={validMarkers} />}
      <SelectedMarkerHandler selectedMarker={selectedMarker || null} />

      {/* Marker cluster group */}
      <MarkerClusterGroup
        markers={validMarkers}
        selectedMarker={selectedMarker || null}
        onMarkerClick={onMarkerClick}
      />

      {/* Map Legend */}
      <div className="leaflet-bottom leaflet-left">
        <div className="leaflet-control bg-white rounded-lg shadow-lg p-3 m-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">Légende</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
              <span className="text-xs text-slate-600">Hôtels</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
              <span className="text-xs text-slate-600">Restaurants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-emerald-500 rounded-full"></span>
              <span className="text-xs text-slate-600">Attractions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-cyan-500 rounded-full"></span>
              <span className="text-xs text-slate-600">Prestataires</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 280px;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
        .custom-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
        .marker-cluster {
          background: transparent !important;
        }
      `}</style>
    </MapContainer>
  );
}
