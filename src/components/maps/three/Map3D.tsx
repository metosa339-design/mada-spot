'use client';

import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useTheme } from 'next-themes';
import MadagascarShape from './MadagascarShape';
import POIPin3D, { POIType } from './POIPin3D';

interface MapMarker {
  id: string;
  type: POIType;
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

interface Map3DProps {
  markers: MapMarker[];
  selectedMarker?: MapMarker | null;
  onMarkerClick?: (marker: MapMarker | null) => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  return reduce;
}

function useIsLowEndDevice(): boolean {
  const [low] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      (navigator.hardwareConcurrency ?? 8) < 4
  );
  return low;
}

export default function Map3D({ markers, selectedMarker, onMarkerClick }: Map3DProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const reduceMotion = usePrefersReducedMotion();
  const isLowEnd = useIsLowEndDevice();

  const validMarkers = useMemo(
    () => markers.filter((m) => m.latitude && m.longitude),
    [markers]
  );

  const skyColor = isDark ? '#0a0a14' : '#cce6ff';
  const seaColor = isDark ? '#0d1b2a' : '#3a8fd9';
  const ambientIntensity = isDark ? 0.35 : 0.6;
  const sunIntensity = isDark ? 0.7 : 1.1;
  const sunColor = isDark ? '#ffd9b3' : '#ffffff';

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Canvas
        shadows={!isLowEnd}
        camera={{ position: [4, 12, 14], fov: 45 }}
        dpr={isLowEnd ? 1 : [1, 2]}
        gl={{ antialias: !isLowEnd, alpha: false }}
        style={{ background: skyColor }}
      >
        <ambientLight intensity={ambientIntensity} />
        <directionalLight
          position={[10, 15, 8]}
          intensity={sunIntensity}
          color={sunColor}
          castShadow={!isLowEnd}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <hemisphereLight
          args={[skyColor, seaColor, 0.3]}
        />

        {/* Sea plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial
            color={seaColor}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>

        <MadagascarShape isDark={isDark} />

        {validMarkers.map((m) => (
          <POIPin3D
            key={m.id}
            id={m.id}
            type={m.type}
            name={m.name}
            city={m.city}
            latitude={m.latitude}
            longitude={m.longitude}
            isSelected={selectedMarker?.id === m.id}
            onClick={() => onMarkerClick?.(m)}
            reduceMotion={reduceMotion}
          />
        ))}

        {isDark && <Stars radius={80} depth={50} count={2000} factor={3} fade />}

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={6}
          maxDistance={28}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={!reduceMotion}
          autoRotateSpeed={0.4}
        />
      </Canvas>

      {/* Legend overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: isDark ? 'rgba(15,15,23,0.85)' : 'rgba(255,255,255,0.92)',
          color: isDark ? 'white' : '#1a1a2e',
          padding: '10px 12px',
          borderRadius: 12,
          fontSize: 12,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Légende</div>
        <LegendRow color="#3b82f6" label="Hôtels" />
        <LegendRow color="#f97316" label="Restaurants" />
        <LegendRow color="#10b981" label="Attractions" />
        <LegendRow color="#06b6d4" label="Prestataires" />
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      <span>{label}</span>
    </div>
  );
}
