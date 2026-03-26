'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Crosshair, X, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Animated pin icon with bounce CSS
const pinIcon = L.divIcon({
  className: 'custom-pin-marker',
  html: `
    <div class="pin-bounce" style="
      background: linear-gradient(135deg, #ff6b35, #ff1493);
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pinBounce 0.6s ease-out;
    ">
      <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Types for unified search results
interface SearchItem {
  id: string;
  type: 'city' | 'establishment' | 'nominatim';
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  zoom: number;
  icon: string;
  rating?: number;
  coverImage?: string;
  establishmentType?: string;
  _category?: string;
}

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}


// Sub-component: handle map click events
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Sub-component: fly to position with immersive animation
function FlyToPosition({ position, zoom }: { position: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 1.8, easeLinearity: 0.25 });
    }
  }, [position, map, zoom]);
  return null;
}

// Inject bounce keyframes once
const BOUNCE_CSS = `
@keyframes pinBounce {
  0% { transform: rotate(-45deg) translateY(-30px); opacity: 0; }
  60% { transform: rotate(-45deg) translateY(6px); opacity: 1; }
  80% { transform: rotate(-45deg) translateY(-3px); }
  100% { transform: rotate(-45deg) translateY(0); }
}
`;


export default function MapLocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress,
}: MapLocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(15);
  const [flyKey, setFlyKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressText, setAddressText] = useState(initialAddress || '');
  const [noResults, setNoResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [markerKey, setMarkerKey] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Default center: Antananarivo
  const defaultCenter: [number, number] = [-18.8792, 47.5079];

  // Inject bounce CSS
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('pin-bounce-css')) {
      const style = document.createElement('style');
      style.id = 'pin-bounce-css';
      style.textContent = BOUNCE_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    setSelectedItem(null);
    setShowPopup(false);
    setMarkerKey(k => k + 1);
    onLocationSelect(lat, lng, addressText);
    reverseGeocode(lat, lng);
  }, [onLocationSelect, addressText]);

  // Reverse geocode via our server proxy
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) {
        setAddressText(data.display_name);
        setSearchQuery(data.display_name);
        onLocationSelect(lat, lng, data.display_name);
      }
    } catch {
      // Ignore
    }
  };

  // Get icon based on Nominatim type
  const getIconForType = (nom: NominatimResult): string => {
    const t = nom.type || '';
    const c = nom.class || '';
    if (c === 'boundary' || t === 'administrative') return '🗺️';
    if (t === 'city' || t === 'town') return '🏙️';
    if (t === 'village') return '🏘️';
    if (t === 'suburb' || t === 'neighbourhood' || t === 'quarter') return '📍';
    if (t === 'hamlet') return '🏡';
    if (c === 'tourism' || c === 'amenity') return '🏨';
    if (c === 'highway') return '🛣️';
    return '📌';
  };

  // Get category label for grouping
  const getCategoryLabel = (nom: NominatimResult): string => {
    const t = nom.type || '';
    const c = nom.class || '';
    if (c === 'boundary' || t === 'administrative') return 'Régions & Districts';
    if (t === 'city' || t === 'town') return 'Villes';
    if (t === 'village' || t === 'hamlet') return 'Villages';
    if (t === 'suburb' || t === 'neighbourhood' || t === 'quarter') return 'Quartiers & Zones';
    return 'Lieux';
  };

  // Search via our server-side proxy (avoids CORS/rate-limit/header issues)
  const proxySearch = async (query: string): Promise<NominatimResult[]> => {
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  // Convert Nominatim results to SearchItems (deduplicated)
  const toSearchItems = (nomResults: NominatimResult[]): SearchItem[] => {
    const seen = new Set<string>();
    return nomResults
      .filter(nom => {
        const key = `${parseFloat(nom.lat).toFixed(4)}_${parseFloat(nom.lon).toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((nom, i) => {
        const lat = parseFloat(nom.lat);
        const lng = parseFloat(nom.lon);
        const t = nom.type || '';
        const c = nom.class || '';
        let zoom = 16;
        if (c === 'boundary' || t === 'administrative') zoom = 12;
        else if (t === 'city' || t === 'town') zoom = 13;
        else if (t === 'village' || t === 'suburb' || t === 'hamlet') zoom = 14;
        else if (t === 'neighbourhood' || t === 'quarter') zoom = 15;

        const nameParts = nom.display_name.split(',');
        const name = nameParts[0].trim();
        const subtitle = nameParts.slice(1, 4).join(',').trim();

        return {
          id: `nom-${i}-${lat.toFixed(4)}`,
          type: 'nominatim' as const,
          name,
          subtitle,
          lat,
          lng,
          zoom,
          icon: getIconForType(nom),
          _category: getCategoryLabel(nom),
        };
      });
  };

  // Main search function — uses server proxy
  const searchAll = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchItems([]);
      setNoResults(false);
      return;
    }

    setIsSearching(true);
    setNoResults(false);

    try {
      const results = await proxySearch(query);
      const items = toSearchItems(results);
      setSearchItems(items);
      setShowResults(items.length > 0);
      setNoResults(items.length === 0);
    } catch {
      setSearchItems([]);
      setNoResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search (300ms)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) {
      setSearchItems([]);
      setNoResults(false);
      setShowResults(false);
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchAll(value);
    }, 300);
  };

  // Select a search item → fly-to + bounce + popup
  const selectItem = (item: SearchItem) => {
    setPosition([item.lat, item.lng]);
    setFlyTarget([item.lat, item.lng]);
    setFlyZoom(item.zoom);
    setFlyKey(k => k + 1);
    setMarkerKey(k => k + 1); // retrigger bounce
    setSelectedItem(item);
    setShowPopup(true);
    setSearchQuery(item.name);
    setAddressText(item.subtitle ? `${item.name}, ${item.subtitle}` : item.name);
    setShowResults(false);
    setSearchItems([]);
    onLocationSelect(item.lat, item.lng, `${item.name}, ${item.subtitle}`);
  };

  // Enter key → auto-select first result
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    // If results already loaded, select first
    if (searchItems.length > 0) {
      selectItem(searchItems[0]);
      return;
    }

    // Otherwise trigger immediate search via proxy
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setIsSearching(true);
      try {
        const results = await proxySearch(searchQuery);

        if (results.length > 0) {
          const nom = results[0];
          const t = nom.type || '';
          const c = nom.class || '';
          let zoom = 16;
          if (c === 'boundary' || t === 'administrative') zoom = 12;
          else if (t === 'city' || t === 'town') zoom = 13;
          else if (t === 'village' || t === 'suburb') zoom = 14;

          selectItem({
            id: `nom-enter`, type: 'nominatim',
            name: nom.display_name.split(',')[0].trim(),
            subtitle: nom.display_name.split(',').slice(1, 3).join(',').trim(),
            lat: parseFloat(nom.lat), lng: parseFloat(nom.lon), zoom, icon: '🔍',
          });
          return;
        }
        setNoResults(true);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Geolocation
  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setFlyTarget([lat, lng]);
        setFlyZoom(16);
        setFlyKey(k => k + 1);
        setMarkerKey(k => k + 1);
        setSelectedItem(null);
        setShowPopup(false);
        onLocationSelect(lat, lng, addressText);
        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Group search items by category for display
  const groupedItems: { label: string; items: SearchItem[] }[] = [];
  const categoryMap = new Map<string, SearchItem[]>();
  for (const item of searchItems) {
    const cat = item._category || 'Lieux';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(item);
  }
  // Order: Villes first, then Quartiers, then Villages, then Régions, then Lieux
  const catOrder = ['Villes', 'Quartiers & Zones', 'Villages', 'Régions & Districts', 'Lieux'];
  for (const cat of catOrder) {
    if (categoryMap.has(cat)) groupedItems.push({ label: cat, items: categoryMap.get(cat)! });
  }
  for (const [cat, items] of categoryMap) {
    if (!catOrder.includes(cat)) groupedItems.push({ label: cat, items });
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative" ref={resultsRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchItems.length > 0 && setShowResults(true)}
              placeholder="Rechercher une ville, un lieu, une adresse..."
              className="w-full pl-10 pr-8 py-3 bg-[#0a0a0f] border border-[#2a2a36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] transition-colors text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff6b35] animate-spin" />
            )}
            {!isSearching && searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchItems([]);
                  setShowResults(false);
                  setNoResults(false);
                  setSelectedItem(null);
                  setShowPopup(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleGeolocation}
            disabled={isLocating}
            className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e] border border-[#2a2a36] rounded-xl text-white hover:border-[#ff6b35] transition-colors disabled:opacity-50"
            title="Ma position"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm">Ma position</span>
          </button>
        </div>

        {/* Grouped search results dropdown */}
        {showResults && searchItems.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#12121e] border border-[#2a2a36] rounded-xl overflow-hidden shadow-2xl max-h-80 overflow-y-auto">
            {groupedItems.map(group => (
              <div key={group.label}>
                <div className="px-3 py-1.5 bg-[#0a0a14] text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0">
                  <MapPin className="w-3 h-3" /> {group.label}
                </div>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#1e1e30] transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {!isSearching && noResults && searchQuery.length >= 2 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#12121e] border border-[#2a2a36] rounded-xl p-4">
            <p className="text-sm text-gray-400 text-center mb-2">Aucun résultat pour &laquo; {searchQuery} &raquo;</p>
            <p className="text-xs text-gray-500 text-center">
              Astuce : cliquez directement sur la carte pour placer votre position
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border-2 border-[#2a2a36] hover:border-[#ff6b35]/50 transition-colors" style={{ height: '300px' }}>
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 16 : 6}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <FlyToPosition key={flyKey} position={flyTarget} zoom={flyZoom} />
          {position && (
            <Marker key={markerKey} position={position} icon={pinIcon}>
              {showPopup && selectedItem && (
                <Popup autoPan={false} className="custom-popup">
                  <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
                    {selectedItem.coverImage && (
                      <img
                        src={getImageUrl(selectedItem.coverImage)}
                        alt={selectedItem.name}
                        style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: '6px 6px 0 0', marginBottom: 6 }}
                      />
                    )}
                    <div style={{ padding: '2px 4px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>
                        {selectedItem.icon} {selectedItem.name}
                      </div>
                      {selectedItem.rating !== undefined && selectedItem.rating > 0 && (
                        <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>
                          {'★'.repeat(Math.round(selectedItem.rating))} {selectedItem.rating.toFixed(1)}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {selectedItem.subtitle}
                      </div>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          )}
        </MapContainer>

        {/* Instruction overlay */}
        {!position && (
          <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
              <span className="text-xs text-gray-300">Recherchez un lieu ou cliquez sur la carte</span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinates display */}
      {position && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a36] rounded-xl">
          <MapPin className="w-4 h-4 text-[#ff6b35]" />
          <div className="flex-1 min-w-0">
            {addressText && (
              <p className="text-xs text-gray-300 truncate">{addressText}</p>
            )}
            <p className="text-xs text-gray-500">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          </div>
          <button
            onClick={() => {
              setPosition(null);
              setAddressText('');
              setSearchQuery('');
              setSelectedItem(null);
              setShowPopup(false);
              onLocationSelect(0, 0, '');
            }}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
