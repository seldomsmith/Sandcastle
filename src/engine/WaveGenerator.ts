/**
 * Sandcastle vs. Tide Simulator - Dynamic Coastal Wave & Tide Generator Engine
 *
 * Implements a Discrete Periodic Wave Cycle Engine:
 * 1. Wave Period (T = 8.0 seconds per wave):
 *    - Surge Phase (0.0s -> 3.5s): Inject a shallow wave pulse (h = 0.02m -> 0.04m)
 *      with forward kinetic velocity (v_y = +1.2 m/s) surging up the beach.
 *    - Ebb / Backwash Phase (3.5s -> 8.0s): Shut off water injection completely at Y = 0.
 *      Set velocity at Y = 0 to allow receding backwash to drain naturally seaward.
 *
 * 2. Macro Base Tide Ratchet:
 *    - Every completed 8-second wave cycle, ratchet the base mean sea level by +0.02m.
 *    - Each successive wave starts its run-up higher up the beach face.
 */

import { GRID_WIDTH, GRAVITY } from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';

export class WaveGenerator {
  private wavePeriod: number = 8.0;      // 8.0 seconds per discrete wave cycle
  private surgeDuration: number = 3.5;   // 3.5 seconds forward surge phase
  private tideIncrement: number = 0.02;  // +0.02m sea level ratchet per cycle
  private maxMacroTide: number = 0.40;    // Peak macro tide elevation cap (m)

  /**
   * Computes discrete periodic wave cycles and ratchets base sea level at row Y = 0.
   */
  public updateBoundary(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, simTime: number): void {
    const { bedHeight, waterDepth, momentumY } = buffers;
    const W = GRID_WIDTH;

    // Determine current wave cycle index and cycle phase position
    const cycleIndex = Math.floor(simTime / this.wavePeriod);
    const cycleTime = simTime % this.wavePeriod;
    const isSurgePhase = cycleTime < this.surgeDuration;

    // Macro base tide ratchets by +0.02m every completed 8s cycle
    const baseMacroTide = Math.min(this.maxMacroTide, cycleIndex * this.tideIncrement);

    // 1. SURGE PHASE (0.0s -> 3.5s): Inject shallow wave pulse with forward kinetic velocity
    if (isSurgePhase) {
      const surgeNormalized = cycleTime / this.surgeDuration;
      const wavePulseHeight = 0.02 + 0.02 * Math.sin(Math.PI * surgeNormalized);
      const targetCrestElevation = baseMacroTide + wavePulseHeight;

      for (let x = 0; x < W; x++) {
        const idx = x; // Row Y = 0 ocean boundary cell
        const b0 = bedHeight[idx];
        const injectedDepth = Math.max(0.01, targetCrestElevation - b0);

        waterDepth[idx] = injectedDepth;
        momentumY[idx] = injectedDepth * 1.2; // Forward surge kinetic velocity (v_y = +1.2 m/s)
      }
    } else {
      // 2. EBB / BACKWASH PHASE (3.5s -> 8.0s): Shut off injection and allow natural backwash drainage
      for (let x = 0; x < W; x++) {
        const idx = x; // Row Y = 0 ocean boundary cell
        const b0 = bedHeight[idx];
        const h0 = waterDepth[idx];
        const totalHead = b0 + h0;

        if (totalHead > baseMacroTide) {
          // Allow backwash outflow to exit grid seaward
          waterDepth[idx] = Math.max(baseMacroTide > b0 ? baseMacroTide - b0 : 0.0, h0 * 0.75);
          momentumY[idx] = -waterDepth[idx] * 0.5; // Negative seaward velocity
        } else {
          // Clamp boundary to base macro tide
          waterDepth[idx] = Math.max(0.0, baseMacroTide - b0);
          momentumY[idx] = 0.0;
        }
      }
    }
  }
}
