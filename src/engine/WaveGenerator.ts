/**
 * Sandcastle vs. Tide Simulator - Dynamic Coastal Wave & Tide Generator Engine
 *
 * Implements a One-Way Non-Vacuum Coastal Inlet Boundary Condition:
 * 1. Continuous Ambient Sea Surface Level (eta_sea):
 *    eta_base(t) = H_max * sin^2(pi * t / (2 * T_duration))
 *    eta_surge(t) = A1 * sin(omega1 * t) + A2 * cos(omega2 * t + phi) + S_group(t)
 *    eta_sea(t) = eta_base(t) + max(0, eta_surge(t))
 *
 * 2. One-Way Non-Vacuum Boundary Condition at Row Y = 0:
 *    - Inflow (eta_sea > b + h): Inject water mass up to incoming crest level and apply
 *      shallow-water celerity: v_y(x, 0) = sqrt(g * max(0.005, eta_sea - b_{x,0}))
 *    - Outflow (eta_sea <= b + h): Allow backwash drainage only when inland head is strictly
 *      higher than ambient sea level (b + h > eta_base). Clamp boundary depth to eta_base
 *      to preserve upstream standing water in moats and excavated basins.
 */

import { GRID_WIDTH, GRAVITY } from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';

export class WaveGenerator {
  private totalTideDuration: number = 60.0; // 60 seconds total tide progression
  private maxTideHeight: number = 0.38;     // Peak astronomical tide height in metres

  /**
   * Computes the dynamic ambient sea surface level and updates the seaward boundary condition at row Y = 0.
   */
  public updateBoundary(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, simTime: number): void {
    const { bedHeight, waterDepth, momentumY } = buffers;
    const W = GRID_WIDTH;
    const g = GRAVITY;

    // 1. CONTINUOUS AMBIENT SEA SURFACE LEVEL (eta_sea)
    const tideRatio = Math.min(1.0, simTime / (2.0 * this.totalTideDuration));
    const etaBase = this.maxTideHeight * Math.pow(Math.sin((Math.PI * tideRatio)), 2.0);

    // High-frequency swell components and low-frequency group set envelopes
    const omega1 = 2.4;
    const omega2 = 4.1;
    const phi = 0.52;

    const A1 = 0.035;
    const A2 = 0.018;

    const swell1 = A1 * Math.sin(omega1 * simTime);
    const swell2 = A2 * Math.cos(omega2 * simTime + phi);
    const groupEnvelope = Math.sin(simTime * 0.35) > 0.3 ? 0.025 : 0.0;

    const etaSurge = swell1 + swell2 + groupEnvelope;
    const etaSea = etaBase + Math.max(0.0, etaSurge);

    // 2. ONE-WAY NON-VACUUM INLET BOUNDARY CONDITION AT ROW Y = 0
    for (let x = 0; x < W; x++) {
      const idx = x; // Row Y = 0 cell index
      const b0 = bedHeight[idx];
      const h0 = waterDepth[idx];
      const totalHead = b0 + h0;

      if (etaSea > totalHead) {
        // Inflow Phase: Incoming wave crest exceeds existing local head
        const injectedDepth = Math.max(0.005, etaSea - b0);
        waterDepth[idx] = injectedDepth;

        // Shallow-Water Celerity: v_y(x, 0) = sqrt(g * max(0.005, eta_sea - b_0))
        const celerity = Math.sqrt(g * Math.max(0.005, etaSea - b0));
        momentumY[idx] = injectedDepth * celerity * 0.35; // Positive inland surge momentum
      } else {
        // Outflow Phase: Wave trough or receding backwash
        // Allow backwash to exit across Y = 0 ONLY if inland head is strictly higher than ambient base tide
        if (totalHead > etaBase) {
          const excessHead = totalHead - etaBase;
          waterDepth[idx] = Math.max(etaBase > b0 ? etaBase - b0 : 0.002, h0 - excessHead * 0.15);
          momentumY[idx] = Math.min(0.0, momentumY[idx] * 0.85); // Seaward backwash outflow
        } else {
          // Clamp boundary water depth to ambient sea level to preserve upstream standing water in moats
          const ambientDepth = Math.max(0.0, etaBase - b0);
          waterDepth[idx] = ambientDepth;
          momentumY[idx] = 0.0;
        }
      }
    }
  }
}
