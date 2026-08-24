/**
 * Sandcastle vs. Tide Simulator - Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Features thin-sheet coastal water swash (pushing inland) and backwash (draining seaward),
 * open seaward drainage boundary at Y=0, and fast 12-second base tide progression.
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

export class PipedFlowSolver {
  private fluxR: Float32Array;
  private fluxL: Float32Array;
  private fluxT: Float32Array;
  private fluxB: Float32Array;
  private deltaDepth: Float32Array;

  private wavePhase: number = 0;

  constructor() {
    this.fluxR = new Float32Array(CELL_COUNT);
    this.fluxL = new Float32Array(CELL_COUNT);
    this.fluxT = new Float32Array(CELL_COUNT);
    this.fluxB = new Float32Array(CELL_COUNT);
    this.deltaDepth = new Float32Array(CELL_COUNT);
  }

  /**
   * Main hydrodynamic tick step.
   * `tideFrame` is the active elapsed frame counter during tide surge.
   */
  public step(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, tideFrame: number): void {
    const { bedHeight, waterDepth, momentumX, momentumY } = buffers;

    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const g = GRAVITY;
    const dt = DT;
    const dx = CELL_SIZE;
    const pipeFactor = (dt * g * PIPE_CROSS_SECTION * 0.2) / VIRTUAL_PIPE_LENGTH;
    const cellArea = dx * dx;

    // 1. SWASH / BACKWASH WAVE CYCLE & TIDE ADVANCEMENT (12s total beach traversal at 1x)
    const timeSec = tideFrame * dt;
    this.wavePhase += (2.0 * Math.PI * dt) / 2.5; // Fast 2.5s wave cycle

    // Swash pulse factor [-1.0 .. +1.0]
    const swashPulse = Math.sin(this.wavePhase);
    const isSwash = swashPulse > 0;

    // Tide progress: 0.0 at T=0s -> 1.0 at T=12s (Full map inundation in 12s at 1x!)
    const tideProgress = Math.min(1.0, timeSec / 12.0);
    
    // Shoreline swash reach line moves steadily across grid Y [10..245] over 12 seconds
    const meanShorelineY = Math.floor(10 + tideProgress * 235);
    const currentReachY = Math.min(H - 1, meanShorelineY + (isSwash ? Math.floor(swashPulse * 20) : -Math.floor(Math.abs(swashPulse) * 10)));

    // Thin coastal water sheet thickness (capped at 2.5cm max depth)
    const maxSheetDepth = 0.025;
    const swashDepth = isSwash ? (swashPulse * maxSheetDepth) : 0.003;

    // Inject thin swash sheet at seaward ocean boundary (Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 row (Ocean boundary)
      if (isSwash) {
        waterDepth[idx] = Math.min(maxSheetDepth, swashDepth);
        momentumY[idx] = 0.25 * swashPulse; // Positive inland momentum
      } else {
        // Backwash phase: drain water back out seaward into ocean
        waterDepth[idx] *= 0.6;
        momentumY[idx] = -0.3 * Math.abs(swashPulse); // Negative seaward momentum
      }
    }

    // 2. PIPE FLUX COMPUTATION WITH REALISTIC SWASH REACH BOUNDARY
    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;
      
      // Beyond current wave swash reach: dry sand
      if (y > Math.max(2, currentReachY)) {
        for (let x = 0; x < W; x++) {
          const idx = rowOffset + x;
          waterDepth[idx] = 0;
          this.fluxR[idx] = 0;
          this.fluxL[idx] = 0;
          this.fluxT[idx] = 0;
          this.fluxB[idx] = 0;
        }
        continue;
      }

      for (let x = 0; x < W; x++) {
        const idx = rowOffset + x;
        let h0 = waterDepth[idx];

        // Hard cap depth to thin coastal sheet (max 2.5cm)
        if (h0 > maxSheetDepth) {
          h0 = maxSheetDepth;
          waterDepth[idx] = maxSheetDepth;
        }

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

        let fR = Math.max(0, this.fluxR[idx] + pipeFactor * (totalHead0 - totalHeadR));
        let fL = Math.max(0, this.fluxL[idx] + pipeFactor * (totalHead0 - totalHeadL));
        let fT = Math.max(0, this.fluxT[idx] + pipeFactor * (totalHead0 - totalHeadT));
        let fB = Math.max(0, this.fluxB[idx] + pipeFactor * (totalHead0 - totalHeadB));

        // Swash / Backwash directional momentum bias
        if (momentumY[idx] > 0) {
          fT += momentumY[idx] * pipeFactor * 0.25;
        } else if (momentumY[idx] < 0) {
          fB += Math.abs(momentumY[idx]) * pipeFactor * 0.35; // Pull backwash seaward
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

    // 3. WATER DEPTH & MOMENTUM UPDATE
    this.deltaDepth.fill(0);

    for (let y = 0; y <= currentReachY && y < H; y++) {
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
      
      // Enforce thin-sheet maximum depth cap (2.5cm max depth!)
      if (hNew > maxSheetDepth) {
        hNew = maxSheetDepth;
      }

      if (hNew < MIN_WATER_DEPTH) {
        hNew = 0.0;
        momentumX[i] = 0.0;
        momentumY[i] = 0.0;
      }
      waterDepth[i] = hNew;
    }

    // 4. OPEN SEAWARD DRAINAGE AT Y = 0 (Backwash drains back into ocean)
    if (!isSwash) {
      for (let x = 0; x < W; x++) {
        waterDepth[x] *= 0.5; // Drain receding backwash
      }
    }
  }
}
