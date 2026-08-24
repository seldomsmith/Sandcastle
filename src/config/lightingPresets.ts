/**
 * Sandcastle vs. Tide Simulator - Environment Lighting Presets
 *
 * Configures sun direction, sun color, ambient color, ocean colors, and bioluminescence
 * for Golden Hour Sunset, High Noon Tropical, and Night Tide environment modes.
 */

import * as THREE from 'three';

export interface LightingPreset {
  id: string;
  name: string;
  icon: string;
  sunPosition: [number, number, number];
  sunColor: string;
  ambientColor: string;
  waterColor: string;
  deepWaterColor: string;
  skyColor: string;
  bioluminescentFoam: boolean;
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: 'high_noon',
    name: 'High Noon Tropical',
    icon: '☀️',
    sunPosition: [2, 14, 4],
    sunColor: '#fffbeb',
    ambientColor: '#334155',
    waterColor: '#0ea5e9',
    deepWaterColor: '#0369a1',
    skyColor: '#0f172a',
    bioluminescentFoam: false
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour Sunset',
    icon: '🌅',
    sunPosition: [12, 3, 6],
    sunColor: '#f97316',
    ambientColor: '#4c1d95',
    waterColor: '#0284c7',
    deepWaterColor: '#1e1b4b',
    skyColor: '#1e1b4b',
    bioluminescentFoam: false
  },
  {
    id: 'night_tide',
    name: 'Night Tide (Bioluminescent)',
    icon: '🌕',
    sunPosition: [-4, 10, -5],
    sunColor: '#38bdf8',
    ambientColor: '#090d16',
    waterColor: '#0369a1',
    deepWaterColor: '#020617',
    skyColor: '#020617',
    bioluminescentFoam: true
  }
];
