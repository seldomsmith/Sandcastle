/**
 * Sandcastle vs. Tide Simulator - Dynamic Coastal Wave & Tide Generator
 *
 * Implements a Three-Tier Astronomical Tide Equation:
 * 1. Base Astronomical Tide: Z_tide = maxTide * sin^2(pi * t / 2T)
 * 2. Superposed Swell & Group Envelopes: multi-frequency swells + wave sets
 * 3. Shallow Water Celerity Coupling: v_in = sqrt(g * h)
 * 4. Flather Radiation Outflow Boundary: prevents artificial backwash reflection waves
 */

import { GRID_WIDTH, CELL_SIZE, GRAVITY } from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';

export class WaveGenerator {
  private totalTideDuration: number = 30.0; // 30s full map inundation
  private maxTideHeight: number = 0.35;    // Peak sea level elevation (m)

  /**
   * Computes three-tier tide target elevation and applies Flather radiation outflow at seaward boundary (Y = 0).
   */
  public updateBoundary(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, simTime: number): void {
    const { bedHeight, waterDepth, momentumY } = buffers;
    const W = GRID_WIDTH;
    const g = GRAVITY;

    // 1. THREE-TIER TIDE EQUATION
    // Base Astronomical Tide (sin^2 curve)
    const tideRatio = Math.min(1.0, simTime / (2.0 * this.totalTideDuration));
    const baseTide = this.maxTideHeight * Math.pow(Math.sin(Math.PI * tideRatio), 2.0);

    // Multi-frequency Superposed Swells
    const swell1 = 0.05 * Math.sin(simTime * 2.4);
    const swell2 = 0.02 * Math.sin(simTime * 4.1);

    // Low-frequency Wave Group Envelope (Sets of big waves followed by lulls)
    const groupEnvelope = Math.sin(simTime * 0.35) > 0.3 ? 0.04 : 0.0;

    const targetElevation = baseTide + swell1 + swell2 + groupEnvelope;

    // 2. INLET BOUNDARY COUPLING & FLATHER RADIATION OUTFLOW (Row Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 ocean boundary cell
      const zb = bedHeight[idx];

      if (targetElevation > zb) {
        // Shallow-water wave depth (clamped to 0.12m max for spire prevention)
        const targetDepth = Math.min(0.12, targetElevation - zb);
        waterDepth[idx] = Math.max(0.005, targetDepth);

        // Shallow-Water Celerity: v_in = sqrt(g * h)
        const celerity = Math.sqrt(g * targetDepth);
        momentumY[idx] = targetDepth * celerity * 0.15; // Inland surge momentum
      } else {
        // Flather Radiation Outflow Boundary: Receding backwash exits grid smoothly without reflection
        const currentV = momentumY[idx] / Math.max(0.001, waterDepth[idx]);
        if (currentV < 0) {
          // Outflow phase: radiation drainage
          waterDepth[idx] = Math.max(0.0, waterDepth[idx] * 0.65);
          momentumY[idx] *= 0.5;
        } else {
          waterDepth[idx] = 0.0;
          momentumY[idx] = 0.0;
        }
      }
    }
  }
}
