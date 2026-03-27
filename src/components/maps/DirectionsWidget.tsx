'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Car, Bus, Footprints, Crosshair, ExternalLink, MapPin, Route } from 'lucide-react';
import TransportInfo from './TransportInfo';
import { useTrans } from '@/i18n';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #ff6b35, #ff1493);
      width: 40px; height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(255,107,53,0.4);
      display: flex; align-items: center; justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">📍</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="
      background: #3b82f6;
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(59,130,246,0.5);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface DirectionsWidgetProps {
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  city?: string;
  district?: string;
}

type TransportMode = 'driving' | 'transit' | 'walking';

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function FitToMarkers({ destination, userPos }: { destination: [number, number]; userPos: [number, number] | null }) {
  const map = useMap();
  const prevUserPos = useRef<[number, number] | null>(null);

  useEffect(() => {
    // Re-fit when user position is first detected
    if (userPos && !prevUserPos.current) {
      const bounds = L.latLngBounds([destination, userPos]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (!userPos && !prevUserPos.current) {
      map.setView(destination, 13);
    }
    prevUserPos.current = userPos;
  }, [destination, userPos, map]);

  return null;
}

export default function DirectionsWidget({
  destinationLat,
  destinationLng,
  destinationName,
  city,
  district,
}: DirectionsWidgetProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [isMounted, setIsMounted] = useState(false);
  const td = useTrans('directions');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const distance = userPosition
    ? haversineDistance(userPosition[0], userPosition[1], destinationLat, destinationLng)
    : null;

  // Estimate travel time
  const estimateTime = () => {
    if (!distance) return null;
    switch (transportMode) {
      case 'driving':
        return Math.round((distance / 30) * 60); // ~30 km/h average in Madagascar
      case 'transit':
        return Math.round((distance / 15) * 60); // ~15 km/h for bus
      case 'walking':
        return Math.round((distance / 5) * 60); // ~5 km/h walking
    }
  };

  const travelTime = estimateTime();

  // Google Maps directions URL
  const getGoogleMapsUrl = () => {
    const hasValidCoords = destinationLat !== 0 && destinationLng !== 0;

    // Always use coordinates when available for reliable results
    const destination = hasValidCoords
      ? `${destinationLat},${destinationLng}`
      : encodeURIComponent(`${destinationName}${city ? `, ${city}` : ''}, Madagascar`);

    if (userPosition) {
      const origin = `${userPosition[0]},${userPosition[1]}`;
      // Always use driving mode for Madagascar (transit/walking often unsupported)
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }

    // No user position -> open place on Google Maps and let user navigate from there
    if (hasValidCoords) {
      return `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${destinationName}${city ? `, ${city}` : ''}, Madagascar`)}&travelmode=driving`;
  };

  // Waze URL (driving only)
  const getWazeUrl = () => {
    if (destinationLat !== 0 && destinationLng !== 0) {
      return `https://waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes`;
    }
    return `https://waze.com/ul?q=${encodeURIComponent(`${destinationName}, Madagascar`)}&navigate=yes`;
  };

  const transportModes = [
    { id: 'driving' as const, icon: Car, label: td.car },
    { id: 'transit' as const, icon: Bus, label: td.transit },
    { id: 'walking' as const, icon: Footprints, label: td.walking },
  ];

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  };

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a36] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a36]">
        <div className="flex items-center gap-2 mb-3">
          <Route className="w-5 h-5 text-[#ff6b35]" />
          <h3 className="text-white font-semibold">{td.howToGetThere}</h3>
        </div>

        {/* My position button */}
        <button
          onClick={handleGeolocation}
          disabled={isLocating}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a36] rounded-xl text-sm text-white hover:border-[#ff6b35] transition-colors disabled:opacity-50"
        >
          <Crosshair className={`w-4 h-4 text-blue-400 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{userPosition ? td.positionDetected : td.useMyPosition}</span>
          {userPosition && <span className="text-green-400 ml-auto text-xs">OK</span>}
        </button>
      </div>

      {/* Interactive map */}
      {isMounted && destinationLat !== 0 && destinationLng !== 0 && (
        <div className="h-[220px] sm:h-[280px]">
          <MapContainer
            center={[destinationLat, destinationLng]}
            zoom={13}
            scrollWheelZoom={true}
            dragging={true}
            zoomControl={true}
            doubleClickZoom={true}
            touchZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[destinationLat, destinationLng]} icon={destinationIcon} />
            {userPosition && <Marker position={userPosition} icon={userIcon} />}
            <FitToMarkers
              destination={[destinationLat, destinationLng]}
              userPos={userPosition}
            />
          </MapContainer>
        </div>
      )}

      {/* Fallback when no coordinates */}
      {isMounted && (destinationLat === 0 || destinationLng === 0) && (
        <div className="h-48 bg-[#0a0a0f] flex flex-col items-center justify-center gap-2 text-slate-500">
          <MapPin className="w-8 h-8" />
          <p className="text-sm">{td.coordinatesUnavailable}</p>
          <p className="text-xs">{td.useGoogleMapsToLocate}</p>
        </div>
      )}

      {/* Transport mode selector */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {transportModes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTransportMode(id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                transportMode === id
                  ? 'bg-[#ff6b35]/10 border-[#ff6b35] text-[#ff6b35]'
                  : 'bg-[#0a0a0f] border-[#2a2a36] text-gray-400 hover:border-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Distance & time estimates */}
        {distance !== null && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0f] rounded-xl">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</p>
              <p className="text-xs text-gray-500">{td.distance}</p>
            </div>
            <div className="w-px h-8 bg-[#2a2a36]" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#ff6b35]">{travelTime ? formatTime(travelTime) : '-'}</p>
              <p className="text-xs text-gray-500">{td.estimate}</p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#ff6b35] to-[#ff1493] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <Navigation className="w-4 h-4" />
            Google Maps
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={getWazeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#33ccff] to-[#0099ff] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <Car className="w-4 h-4" />
            Waze
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Transport info for transit mode */}
        {transportMode === 'transit' && city && (
          <TransportInfo city={city} district={district} destinationName={destinationName} />
        )}

        {/* Destination info */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4 text-[#ff6b35]" />
          <span className="truncate">{destinationName}</span>
        </div>
      </div>
    </div>
  );
}
