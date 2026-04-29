import { CENTER_LAT, CENTER_LNG, SCENE_SCALE } from './madagascarPolygon';

export function latLngToScene(lat: number, lng: number): { x: number; z: number } {
  return {
    x: (lng - CENTER_LNG) * SCENE_SCALE,
    z: (CENTER_LAT - lat) * SCENE_SCALE,
  };
}
