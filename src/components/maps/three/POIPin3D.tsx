'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToScene } from './projection';

export type POIType = 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER';

const TYPE_COLORS: Record<POIType, string> = {
  HOTEL: '#3b82f6',
  RESTAURANT: '#f97316',
  ATTRACTION: '#10b981',
  PROVIDER: '#06b6d4',
};

const TYPE_LABELS: Record<POIType, string> = {
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
};

interface POIPin3DProps {
  id: string;
  type: POIType;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  onClick: () => void;
  reduceMotion: boolean;
}

export default function POIPin3D({
  type,
  name,
  city,
  latitude,
  longitude,
  isSelected,
  onClick,
  reduceMotion,
}: POIPin3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { x, z } = latLngToScene(latitude, longitude);
  const baseY = 0.45;
  const color = TYPE_COLORS[type];
  const active = hovered || isSelected;

  useFrame((state) => {
    if (!groupRef.current || reduceMotion) return;
    const t = state.clock.elapsedTime;
    const float = Math.sin(t * 1.6 + x + z) * 0.05;
    groupRef.current.position.y = baseY + float + (active ? 0.15 : 0);
  });

  return (
    <group
      ref={groupRef}
      position={[x, baseY, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh castShadow>
        <coneGeometry args={[0.12, 0.4, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.6 : 0.25}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.7 : 0.3}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      {active && (
        <Html
          position={[0, 0.7, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(15, 15, 23, 0.92)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: `1px solid ${color}`,
            }}
          >
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              {TYPE_LABELS[type]} · {city}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
