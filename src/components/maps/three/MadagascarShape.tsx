'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { MADAGASCAR_OUTLINE, CENTER_LAT, CENTER_LNG, SCENE_SCALE } from './madagascarPolygon';

interface MadagascarShapeProps {
  isDark: boolean;
}

export default function MadagascarShape({ isDark }: MadagascarShapeProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    MADAGASCAR_OUTLINE.forEach(([lat, lng], i) => {
      const sx = (lng - CENTER_LNG) * SCENE_SCALE;
      const sy = (lat - CENTER_LAT) * SCENE_SCALE;
      if (i === 0) shape.moveTo(sx, sy);
      else shape.lineTo(sx, sy);
    });
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    geom.rotateX(-Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const landColor = isDark ? '#2a3d2f' : '#5d8a5e';
  const emissive = isDark ? '#0a1410' : '#000000';

  return (
    <mesh geometry={geometry} receiveShadow castShadow position={[0, 0, 0]}>
      <meshStandardMaterial
        color={landColor}
        emissive={emissive}
        emissiveIntensity={isDark ? 0.15 : 0}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
