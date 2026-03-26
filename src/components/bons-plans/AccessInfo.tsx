'use client';

import { Car, Plane, Ship, MapPin, ParkingCircle, AlertTriangle } from 'lucide-react';

// Major Madagascar airports with coordinates
const MG_AIRPORTS: { name: string; code: string; lat: number; lng: number }[] = [
  { name: 'Ivato (Antananarivo)', code: 'TNR', lat: -18.7969, lng: 47.4788 },
  { name: 'Fascene (Nosy Be)', code: 'NOS', lat: -13.3121, lng: 48.3148 },
  { name: 'Arrachart (Diego Suarez)', code: 'DIE', lat: -12.3494, lng: 49.2917 },
  { name: 'Amborovy (Mahajanga)', code: 'MJN', lat: -15.6668, lng: 46.3513 },
  { name: 'Tolagnaro (Fort Dauphin)', code: 'FTU', lat: -25.0381, lng: 46.9561 },
  { name: 'Toamasina', code: 'TMM', lat: -18.1095, lng: 49.3926 },
  { name: 'Morondava', code: 'MOQ', lat: -20.2847, lng: 44.3176 },
  { name: 'Sainte-Marie', code: 'SMS', lat: -17.0939, lng: 49.8158 },
  { name: 'Tulear', code: 'TLE', lat: -23.3834, lng: 43.7285 },
];

// Islands that need boat/plane access
const ISLAND_KEYWORDS = ['nosy be', 'nosy komba', 'nosy iranja', 'nosy sakatia', 'sainte-marie', 'ile aux nattes', 'nosy boraha', 'nosy mitsio'];

// Remote areas typically requiring 4x4
const REMOTE_KEYWORDS = ['tsingy', 'ankarana', 'masoala', 'marojejy', 'andringitra', 'isalo', 'ranomafana', 'andasibe', 'mantadia', 'kirindy', 'bemaraha'];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface AccessInfoProps {
  city: string;
  district?: string;
  address?: string;
  hasParking?: boolean;
  latitude?: number;
  longitude?: number;
}

export default function AccessInfo({ city, district, address, hasParking, latitude, longitude }: AccessInfoProps) {
  const tips: { icon: React.ReactNode; text: string; color: string }[] = [];
  const locationStr = `${city} ${district || ''} ${address || ''}`.toLowerCase();

  // Check island access
  if (ISLAND_KEYWORDS.some((k) => locationStr.includes(k))) {
    tips.push({
      icon: <Ship className="w-4 h-4" />,
      text: 'Accessible par bateau ou avion',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    });
  }

  // Check remote/4x4
  if (REMOTE_KEYWORDS.some((k) => locationStr.includes(k))) {
    tips.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      text: '4x4 recommande pour l\'acces',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    });
  }

  // Nearest airport
  if (latitude && longitude) {
    let nearest = MG_AIRPORTS[0];
    let minDist = haversineKm(latitude, longitude, nearest.lat, nearest.lng);
    for (const airport of MG_AIRPORTS.slice(1)) {
      const d = haversineKm(latitude, longitude, airport.lat, airport.lng);
      if (d < minDist) { minDist = d; nearest = airport; }
    }
    if (minDist < 100) {
      const timeMin = Math.round(minDist * 1.5); // rough estimate: ~40km/h avg in MG
      tips.push({
        icon: <Plane className="w-4 h-4" />,
        text: `A ${Math.round(minDist)} km de l'aeroport ${nearest.name} (~${timeMin > 60 ? `${Math.floor(timeMin / 60)}h${timeMin % 60 > 0 ? timeMin % 60 + 'min' : ''}` : timeMin + ' min'})`,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      });
    }
  }

  // Parking
  if (hasParking) {
    tips.push({
      icon: <ParkingCircle className="w-4 h-4" />,
      text: 'Parking gratuit disponible',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    });
  }

  // Address
  const fullAddress = address || [district, city].filter(Boolean).join(', ');

  if (tips.length === 0 && !fullAddress) return null;

  return (
    <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] self-start">
      <div className="flex items-center gap-2 mb-4">
        <Car className="w-5 h-5 text-orange-400" />
        <h3 className="font-semibold text-white">Acces & Transport</h3>
      </div>

      {fullAddress && (
        <div className="flex items-start gap-2 mb-4 text-sm text-slate-400">
          <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>{fullAddress}</span>
        </div>
      )}

      {tips.length > 0 && (
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${tip.color}`}>
              {tip.icon}
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
