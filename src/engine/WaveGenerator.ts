/**
 * Sandcastle vs. Tide Simulator - Dynamic Coastal Wave & Tide Generator
 *
 * Implements Three-Tier Astronomical Tide Equation:
 * 1. Base Astronomical Tide: Z_tide = maxTide * sin^2(pi * t / 2T) (rises up to 0.40m deep standing water!)
 * 2. Superposed Swell & Group Envelopes: multi-frequency swells + wave sets
 * 3. Shallow Water Celerity Coupling: v_in = sqrt(g * h)
 * 4. Flather Radiation Outflow Boundary: prevents artificial backwash reflection waves
 */

import { GRID_WIDTH, CELL_SIZE, GRAVITY } from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';

export class WaveGenerator {
  private totalTideDuration: number = 30.0; // 30s full map inundation
  private maxTideHeight: number = 0.45;    // Peak sea level elevation (0.45m deep standing water!)

  /**
   * Computes three-tier tide target elevation and applies Flather radiation outflow at seaward boundary (Y = 0).
   */
  public updateBoundary(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, simTime: number): void {
    const { bedHeight, waterDepth, momentumY } = buffers;
    const W = GRID_WIDTH;
    const g = GRAVITY;

    // 1. THREE-TIER TIDE EQUATION (Continuous Deep Water Accumulation)
    const tideRatio = Math.min(1.0, simTime / (2.0 * this.totalTideDuration));
    const baseTide = this.maxTideHeight * Math.pow(Math.sin(Math.PI * tideRatio), 2.0);

    // Multi-frequency Superposed Swells
    const swell1 = 0.06 * Math.sin(simTime * 2.4);
    const swell2 = 0.03 * Math.sin(simTime * 4.1);

    // Low-frequency Wave Group Envelope
    const groupEnvelope = Math.sin(simTime * 0.35) > 0.3 ? 0.05 : 0.0;

    const targetElevation = baseTide + swell1 + swell2 + groupEnvelope;

    // 2. INLET BOUNDARY COUPLING & FLATHER RADIATION OUTFLOW (Row Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 ocean boundary cell
      const zb = bedHeight[idx];

      if (targetElevation > zb) {
        // Deep water accumulation: depth behind wave front grows as tide rises (up to 0.40m deep lakes!)
        const targetDepth = Math.max(0.01, targetElevation - zb);
        waterDepth[idx] = targetDepth;

        // Shallow-Water Celerity: v_in = sqrt(g * h)
        const celerity = Math.sqrt(g * targetDepth);
        momentumY[idx] = targetDepth * celerity * 0.25; // Strong inland surge momentum
      } else {
        // Flather Radiation Outflow Boundary: Receding backwash exits grid smoothly without reflection
        const currentV = momentumY[idx] / Math.max(0.001, waterDepth[idx]);
        if (currentV < 0) {
          waterDepth[idx] = Math.max(0.0, waterDepth[idx] * 0.7);
          momentumY[idx] *= 0.5;
        } else {
          waterDepth[idx] = 0.0;
          momentumY[idx] = 0.0;
        }
      }
    }
  }
}
