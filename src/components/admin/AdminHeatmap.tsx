'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';

// Fix Leaflet default icon issue with Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

interface HeatmapZone {
  city: string;
  region: string | null;
  lat: number;
  lng: number;
  viewCount: number;
  establishmentCount: number;
  types: Record<string, number>;
}

interface AdminHeatmapProps {
  period: string;
}

// Auto-fit bounds to all zones
function FitBounds({ zones }: { zones: HeatmapZone[] }) {
  const map = useMap();
  useEffect(() => {
    if (zones.length === 0) return;
    const bounds = L.latLngBounds(zones.map(z => [z.lat, z.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  }, [zones, map]);
  return null;
}

// Scale radius from view count (min 8, max 40)
function getRadius(viewCount: number, maxViews: number): number {
  if (maxViews === 0) return 8;
  const ratio = viewCount / maxViews;
  return Math.max(8, Math.min(40, 8 + ratio * 32));
}

// Color intensity from view count
function getColor(viewCount: number, maxViews: number): string {
  if (maxViews === 0) return '#ff6b35';
  const ratio = viewCount / maxViews;
  if (ratio > 0.7) return '#ef4444';
  if (ratio > 0.4) return '#ff6b35';
  if (ratio > 0.15) return '#f59e0b';
  return '#6b7280';
}

export default function AdminHeatmap({ period }: AdminHeatmapProps) {
  const [zones, setZones] = useState<HeatmapZone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats/heatmap?period=${period}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchHeatmap(); }, [fetchHeatmap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
        <MapPin className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Aucune donnee de consultation</p>
      </div>
    );
  }

  const maxViews = Math.max(...zones.map(z => z.viewCount), 1);

  // Madagascar center
  const center: [number, number] = [-18.9, 47.5];

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ height: 400 }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#080810' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds zones={zones} />
        {zones.map((zone) => {
          const radius = getRadius(zone.viewCount, maxViews);
          const color = getColor(zone.viewCount, maxViews);
          return (
            <CircleMarker
              key={zone.city}
              center={[zone.lat, zone.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
                opacity: 0.8,
              }}
            >
              <Tooltip direction="top" className="heatmap-tooltip">
                <div className="text-xs">
                  <p className="font-bold">{zone.city}</p>
                  {zone.region && <p className="text-gray-400">{zone.region}</p>}
                  <p className="mt-1"><strong>{zone.viewCount}</strong> vues</p>
                  <p>{zone.establishmentCount} etablissement{zone.establishmentCount > 1 ? 's' : ''}</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-[#0c0c16]/90 border border-[#1e1e2e] rounded-lg p-2.5 text-[10px] text-gray-400 space-y-1 z-[1000]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]" /> Haute densite
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff6b35]" /> Moyenne
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]" /> Faible
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#6b7280]" /> Tres faible
        </div>
      </div>
    </div>
  );
}
