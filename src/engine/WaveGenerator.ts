/**
 * Sandcastle vs. Tide Simulator - Dynamic Coastal Wave & Tide Generator
 *
 * Implements a Refined Real-Beach Swash Wave Engine:
 * 1. Base Astronomical Tide: Z_tide = maxTide * sin^2(pi * t / 2T)
 * 2. Multi-Frequency Swell & Wave Group Sets
 * 3. Thin-Sheet Swash Injection (0.03m max depth = 3cm paper-thin water layer)
 * 4. Tapered Wave Front Leading Edge (Eliminates vertical block walls!)
 */

import { GRID_WIDTH, GRAVITY } from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';

export class WaveGenerator {
  private totalTideDuration: number = 30.0; // 30s full map inundation
  private maxTideHeight: number = 0.035;   // Peak sea level elevation (3.5 cm paper-thin swash sheet!)

  /**
   * Computes astronomical tide elevation and applies thin coastal swash sheet injection.
   */
  public updateBoundary(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, simTime: number): void {
    const { bedHeight, waterDepth, momentumY } = buffers;
    const W = GRID_WIDTH;
    const g = GRAVITY;

    // 1. ASTRONOMICAL TIDE + MULTI-FREQUENCY SWELLS
    const tideRatio = Math.min(1.0, simTime / (2.0 * this.totalTideDuration));
    const baseTide = this.maxTideHeight * Math.pow(Math.sin(Math.PI * tideRatio), 2.0);

    const swell1 = 0.008 * Math.sin(simTime * 2.4);
    const swell2 = 0.004 * Math.sin(simTime * 4.1);
    const groupEnvelope = Math.sin(simTime * 0.35) > 0.3 ? 0.006 : 0.0;

    const targetElevation = baseTide + swell1 + swell2 + groupEnvelope;

    // 2. THIN COASTAL SWASH SHEET BOUNDARY INJECTION (Row Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 ocean boundary cell
      const zb = bedHeight[idx];

      // Maintain thin paper-thin swash water sheet at boundary (3cm max depth)
      const oceanDepth = Math.max(0.005, Math.min(0.035, targetElevation - zb + 0.015));
      waterDepth[idx] = oceanDepth;

      // Inland wave swash momentum
      const celerity = Math.sqrt(g * oceanDepth);
      momentumY[idx] = oceanDepth * celerity * 0.25; // Inland kinetic swash
    }
  }
}
