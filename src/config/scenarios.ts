/**
 * Sandcastle vs. Tide Simulator - Scenario Presets
 *
 * Provides pre-configured coastal scenarios (Shallow Gradient Flats, Steep Berm Beach, Estuary Inlet).
 */

import { ScenarioConfig } from '../types/simulation';

export interface CoastalScenario {
  id: string;
  name: string;
  description: string;
  config: ScenarioConfig;
}

export const COASTAL_SCENARIOS: CoastalScenario[] = [
  {
    id: 'shallow_flats',
    name: 'Shallow Gradient Flats',
    description: 'Gentle sloping beach with wide swash inundation.',
    config: {
      waveAmplitude: 0.08,
      wavePeriod: 6.0,
      tideRiseRate: 0.00006,
      baseSeaLevel: 0.03,
      windVelocityX: 0.1,
      windVelocityY: 0.1,
      sedimentCohesion: 0.6
    }
  },
  {
    id: 'steep_berm',
    name: 'Steep Berm Beach',
    description: 'High angle berm with heavy pounding shorebreak waves.',
    config: {
      waveAmplitude: 0.18,
      wavePeriod: 3.5,
      tideRiseRate: 0.00012,
      baseSeaLevel: 0.08,
      windVelocityX: 0.4,
      windVelocityY: 0.3,
      sedimentCohesion: 0.4
    }
  },
  {
    id: 'estuary_inlet',
    name: 'Estuary Inlet',
    description: 'Cross-flowing tidal estuary currents.',
    config: {
      waveAmplitude: 0.12,
      wavePeriod: 4.5,
      tideRiseRate: 0.00009,
      baseSeaLevel: 0.05,
      windVelocityX: -0.3,
      windVelocityY: 0.2,
      sedimentCohesion: 0.7
    }
  }
];
