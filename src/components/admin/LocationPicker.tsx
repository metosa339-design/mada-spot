'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2 } from 'lucide-react';

const pin = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;background:#ff6b35;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const MADAGASCAR: [number, number] = [-18.9, 47.5];

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (v: { lat: number; lng: number; city?: string; address?: string }) => void;
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number') map.setView([lat, lng], Math.max(map.getZoom(), 13));
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<any>(null);

  const search = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(value + ' Madagascar')}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 350);
  };

  const pickResult = (r: any) => {
    const la = parseFloat(r.lat), ln = parseFloat(r.lon);
    const addr = r.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    onChange({ lat: la, lng: ln, city, address: r.display_name });
    setResults([]);
    setQ(r.display_name?.split(',').slice(0, 2).join(', ') || '');
  };

  const reverseAndSet = async (la: number, ln: number) => {
    onChange({ lat: la, lng: ln });
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${la}&lon=${ln}`);
      const data = await res.json();
      const addr = data?.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      if (city || data?.display_name) onChange({ lat: la, lng: ln, city, address: data?.display_name });
    } catch { /* garde juste les coords */ }
  };

  const hasPoint = typeof lat === 'number' && typeof lng === 'number';

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Chercher une ville, un quartier… (ex. Nosy Be, Ambatoloaka)"
            className="flex-1 text-sm outline-none bg-transparent"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        {results.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => pickResult(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-64 rounded-xl overflow-hidden border border-gray-300">
        <MapContainer center={hasPoint ? [lat as number, lng as number] : MADAGASCAR} zoom={hasPoint ? 13 : 6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {hasPoint && <Marker position={[lat as number, lng as number]} icon={pin} />}
          <ClickHandler onPick={reverseAndSet} />
          <Recenter lat={lat} lng={lng} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">
        Cherchez le lieu ci-dessus ou <strong>cliquez directement sur la carte</strong> pour poser le point.
        {hasPoint && <span className="ml-1 text-gray-400">({(lat as number).toFixed(5)}, {(lng as number).toFixed(5)})</span>}
      </p>
    </div>
  );
}
