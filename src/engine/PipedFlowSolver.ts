/**
 * Sandcastle vs. Tide Simulator - Extended Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Integrates WaveGenerator for One-Way Non-Vacuum Inlet boundary conditions,
 * dynamic Manning wet-bed friction scaling (C_f = 0.06 -> 0.012), and 100% emergent
 * advective momentum transfer across the full 256-cell domain.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_COUNT,
  CELL_SIZE,
  DT,
  GRAVITY,
  MIN_WATER_DEPTH,
  PIPE_CROSS_SECTION,
  VIRTUAL_PIPE_LENGTH
} from '../config/constants';
import { SharedSimulationBuffers, ScenarioConfig } from '../types/simulation';
import { WaveGenerator } from './WaveGenerator';

export class PipedFlowSolver {
  private fluxR: Float32Array;
  private fluxL: Float32Array;
  private fluxT: Float32Array;
  private fluxB: Float32Array;
  private deltaDepth: Float32Array;

  private waveGenerator: WaveGenerator;

  constructor() {
    this.fluxR = new Float32Array(CELL_COUNT);
    this.fluxL = new Float32Array(CELL_COUNT);
    this.fluxT = new Float32Array(CELL_COUNT);
    this.fluxB = new Float32Array(CELL_COUNT);
    this.deltaDepth = new Float32Array(CELL_COUNT);

    this.waveGenerator = new WaveGenerator();
  }

  /**
   * Primary hydrodynamic tick execution step.
   * `tideFrame` is the active elapsed frame counter during tide surge.
   */
  public step(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, tideFrame: number): void {
    const { bedHeight, waterDepth, momentumX, momentumY, saturation } = buffers;

    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const g = GRAVITY;
    const dt = DT;
    const dx = CELL_SIZE;
    const basePipeFactor = (dt * g * PIPE_CROSS_SECTION * 0.22) / VIRTUAL_PIPE_LENGTH;
    const cellArea = dx * dx;
    const simTime = tideFrame * dt;

    // 1. ONE-WAY NON-VACUUM INLET BOUNDARY UPDATE AT ROW Y = 0
    this.waveGenerator.updateBoundary(buffers, scenario, simTime);

    // 2. PIPE FLUX COMPUTATION WITH DYNAMIC MANNING WET-BED FRICTION SCALING
    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;

      for (let x = 0; x < W; x++) {
        const idx = rowOffset + x;
        const h0 = waterDepth[idx];

        if (h0 < MIN_WATER_DEPTH) {
          this.fluxR[idx] = 0;
          this.fluxL[idx] = 0;
          this.fluxT[idx] = 0;
          this.fluxB[idx] = 0;
          continue;
        }

        const z0 = bedHeight[idx];
        const totalHead0 = z0 + h0;

        const totalHeadR = (x < W - 1) ? bedHeight[idx + 1] + waterDepth[idx + 1] : totalHead0;
        const totalHeadL = (x > 0) ? bedHeight[idx - 1] + waterDepth[idx - 1] : totalHead0;
        const totalHeadT = (y < H - 1) ? bedHeight[idx + W] + waterDepth[idx + W] : totalHead0;
        const totalHeadB = (y > 0) ? bedHeight[idx - W] + waterDepth[idx - W] : totalHead0;

        // Dynamic Manning Wet-Bed Friction Scaling (C_f):
        // Dry sand (S < 0.2): High friction (C_f = 0.06) for initial porous resistance.
        // Saturated / Wet sand (S > 0.7 or h > 0.005m): Low friction (C_f = 0.012) allowing
        // thin-sheet wave momentum to propagate across full 256-cell domain without stalling.
        const sat = saturation[idx];
        const isWet = sat > 0.7 || h0 > 0.005;
        const frictionCoeff = isWet ? 0.012 : 0.06;
        const frictionDamping = Math.max(0.2, 1.0 - frictionCoeff * dt * 10.0);

        const localPipeFactor = basePipeFactor * frictionDamping;

        let fR = Math.max(0, this.fluxR[idx] + localPipeFactor * (totalHead0 - totalHeadR));
        let fL = Math.max(0, this.fluxL[idx] + localPipeFactor * (totalHead0 - totalHeadL));
        let fT = Math.max(0, this.fluxT[idx] + localPipeFactor * (totalHead0 - totalHeadT));
        let fB = Math.max(0, this.fluxB[idx] + localPipeFactor * (totalHead0 - totalHeadB));

        // Advective momentum coupling
        if (momentumY[idx] > 0) {
          fT += momentumY[idx] * localPipeFactor * 0.3;
        } else if (momentumY[idx] < 0) {
          fB += Math.abs(momentumY[idx]) * localPipeFactor * 0.35;
        }

        if (momentumX[idx] > 0) {
          fR += momentumX[idx] * localPipeFactor * 0.3;
        } else if (momentumX[idx] < 0) {
          fL += Math.abs(momentumX[idx]) * localPipeFactor * 0.3;
        }

        const totalOutflowVolume = (fR + fL + fT + fB) * dt;
        const availableVolume = h0 * cellArea;

        if (totalOutflowVolume > availableVolume && totalOutflowVolume > 0) {
          const scale = availableVolume / totalOutflowVolume;
          fR *= scale;
          fL *= scale;
          fT *= scale;
          fB *= scale;
        }

        this.fluxR[idx] = fR;
        this.fluxL[idx] = fL;
        this.fluxT[idx] = fT;
        this.fluxB[idx] = fB;
      }
    }

    // 3. WATER DEPTH & MOMENTUM UPDATE (100% Emergent Hydrodynamics)
    this.deltaDepth.fill(0);

    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;
      for (let x = 0; x < W; x++) {
        const idx = rowOffset + x;
        const fR = this.fluxR[idx];
        const fL = this.fluxL[idx];
        const fT = this.fluxT[idx];
        const fB = this.fluxB[idx];

        const totalOutflow = fR + fL + fT + fB;

        const inR = (x > 0) ? this.fluxR[idx - 1] : 0;
        const inL = (x < W - 1) ? this.fluxL[idx + 1] : 0;
        const inT = (y > 0) ? this.fluxT[idx - W] : 0;
        const inB = (y < H - 1) ? this.fluxB[idx + W] : 0;

        const totalInflow = inR + inL + inT + inB;
        const netVolumeChange = (totalInflow - totalOutflow) * dt;

        this.deltaDepth[idx] = netVolumeChange / cellArea;

        const netUx = ((inR - fL) + (fR - inL)) * 0.5;
        const netUy = ((inT - fB) + (fT - inB)) * 0.5;

        momentumX[idx] = netUx / dx;
        momentumY[idx] = netUy / dx;
      }
    }

    for (let i = 0; i < CELL_COUNT; i++) {
      let hNew = waterDepth[i] + this.deltaDepth[i];

      if (hNew < MIN_WATER_DEPTH) {
        hNew = 0.0;
        momentumX[i] = 0.0;
        momentumY[i] = 0.0;
      }
      waterDepth[i] = hNew;
    }
  }
}
