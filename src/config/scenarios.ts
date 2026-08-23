/**
 * Sandcastle vs. Tide Simulator - Scenario Preset Configurations
 *
 * Defines coastal geography profiles (Shallow Gradient Flats, Steep Berm Beach, Estuary Inlets)
 * with wave amplitude, tide rise rate, wave period, and sediment cohesion parameters.
 */

import { ScenarioConfig } from '../types/simulation';

export interface CoastalScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  config: ScenarioConfig;
}

export const COASTAL_SCENARIOS: CoastalScenario[] = [
  {
    id: 'shallow-flats',
    name: 'Shallow Gradient Flats',
    description: 'Wide, low-energy dissipation zone with long rolling wave surges. Ideal for concentric moat defences.',
    difficulty: 'Easy',
    config: {
      waveAmplitude: 0.12,
      wavePeriod: 6.0,
      tideRiseRate: 0.0005,
      baseSeaLevel: 0.08,
      windVelocityX: 0.2,
      windVelocityY: 0.1,
      sedimentCohesion: 0.6
    }
  },
  {
    id: 'steep-berm',
    name: 'Steep Berm Beach',
    description: 'High-energy plunging breakers with severe toe scour risk. Requires parabolic seawalls and pebble armouring.',
    difficulty: 'Medium',
    config: {
      waveAmplitude: 0.24,
      wavePeriod: 4.2,
      tideRiseRate: 0.001,
      baseSeaLevel: 0.15,
      windVelocityX: 0.8,
      windVelocityY: 0.4,
      sedimentCohesion: 0.4
    }
  },
  {
    id: 'estuary-inlet',
    name: 'Estuary Inlet',
    description: 'Dual-angle converging water intrusion producing turbulent eddy vortices. Demands diverted sluiceway channels.',
    difficulty: 'Hard',
    config: {
      waveAmplitude: 0.18,
      wavePeriod: 5.0,
      tideRiseRate: 0.0012,
      baseSeaLevel: 0.12,
      windVelocityX: 0.5,
      windVelocityY: 0.6,
      sedimentCohesion: 0.3
    }
  }
];
