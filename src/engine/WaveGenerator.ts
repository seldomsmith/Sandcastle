/**
 * Sandcastle vs. Tide Simulator - Dynamic Coastal Wave & Tide Generator
 *
 * Implements a Refined Real-Beach Wave & Tide Engine:
 * 1. Base Astronomical Tide: Z_tide = maxTide * sin^2(pi * t / 2T) (rises up to 0.45m deep standing ocean water!)
 * 2. Multi-Frequency Swell & Wave Group Sets
 * 3. Continuous Boundary Inundation (Eliminates boundary over-drainage flaw!)
 * 4. High-Kinetic Swash Surge Momentum for Sandcastle Scour & Destruction
 */

import { GRID_WIDTH, GRAVITY } from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';

export class WaveGenerator {
  private totalTideDuration: number = 30.0; // 30s full map inundation
  private maxTideHeight: number = 0.45;    // Peak sea level elevation (0.45m deep standing water!)

  /**
   * Computes astronomical tide elevation and applies continuous ocean boundary momentum without over-drainage.
   */
  public updateBoundary(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, simTime: number): void {
    const { bedHeight, waterDepth, momentumY } = buffers;
    const W = GRID_WIDTH;
    const g = GRAVITY;

    // 1. ASTRONOMICAL TIDE + MULTI-FREQUENCY SWELLS
    const tideRatio = Math.min(1.0, simTime / (2.0 * this.totalTideDuration));
    const baseTide = this.maxTideHeight * Math.pow(Math.sin(Math.PI * tideRatio), 2.0);

    const swell1 = 0.06 * Math.sin(simTime * 2.4);
    const swell2 = 0.03 * Math.sin(simTime * 4.1);
    const groupEnvelope = Math.sin(simTime * 0.35) > 0.3 ? 0.05 : 0.0;

    const targetElevation = baseTide + swell1 + swell2 + groupEnvelope;

    // 2. CONTINUOUS OCEAN BOUNDARY INJECTION (Row Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 ocean boundary cell
      const zb = bedHeight[idx];

      // Maintain continuous ocean water depth at boundary (up to 0.45m)
      const oceanDepth = Math.max(0.02, Math.min(0.45, targetElevation - zb + 0.03));
      waterDepth[idx] = oceanDepth;

      // Inland wave surge momentum
      const celerity = Math.sqrt(g * oceanDepth);
      momentumY[idx] = oceanDepth * celerity * 0.35; // Strong inland kinetic surge
    }
  }
}
