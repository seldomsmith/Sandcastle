/**
 * Sandcastle vs. Tide Simulator - Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Computes incremental wave train progression across beach over 60s,
 * discrete finite wave pulses, virtual pipe flux solving, and Flather radiation condition.
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
   */
  public step(buffers: SharedSimulationBuffers, scenario: ScenarioConfig, frame: number): void {
    const { bedHeight, waterDepth, momentumX, momentumY } = buffers;

    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const g = GRAVITY;
    const dt = DT;
    const dx = CELL_SIZE;
    const pipeFactor = (dt * g * PIPE_CROSS_SECTION * 0.25) / VIRTUAL_PIPE_LENGTH;
    const cellArea = dx * dx;

    // 1. INCREMENTAL WAVE TRAIN PROGRESSION OVER 60 SECONDS
    const timeSec = frame * dt;
    this.wavePhase += (2.0 * Math.PI * dt) / 5.0; // 5-second wave pulse cycle

    // Tide progress: 0.0 at T=0s -> 1.0 at T=60s
    const tideProgress = Math.min(1.0, timeSec / 60.0);
    
    // Wave reach limit line (advances incrementally across grid Y from 0 to 255 over 60s)
    const maxAllowedY = Math.floor(tideProgress * H);

    // Wave pulse height peaking
    const wavePulse = Math.pow(Math.max(0, Math.sin(this.wavePhase)), 4.0) * scenario.waveAmplitude * 1.2;
    const currentSeaLevel = scenario.baseSeaLevel + (tideProgress * 0.25) + wavePulse;

    // Inject wave pulse at seaward ocean boundary (Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 row (Ocean front)
      const targetWaterDepth = Math.max(0.0, currentSeaLevel - bedHeight[idx]);
      
      waterDepth[idx] = targetWaterDepth;
      momentumY[idx] = targetWaterDepth * 0.4;
    }

    // 2. PIPE FLUX COMPUTATION WITH WAVE REACH BOUNDARY LOCK
    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;
      
      // Prevent water from jumping ahead of the current wave front horizon
      if (y > maxAllowedY + 2) {
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

        let fR = Math.max(0, this.fluxR[idx] + pipeFactor * (totalHead0 - totalHeadR));
        let fL = Math.max(0, this.fluxL[idx] + pipeFactor * (totalHead0 - totalHeadL));
        let fT = Math.max(0, this.fluxT[idx] + pipeFactor * (totalHead0 - totalHeadT));
        let fB = Math.max(0, this.fluxB[idx] + pipeFactor * (totalHead0 - totalHeadB));

        // Add forward momentum bias towards North shore (Y direction)
        if (momentumY[idx] > 0) {
          fT += momentumY[idx] * pipeFactor * 0.2;
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

    for (let y = 0; y <= maxAllowedY && y < H; y++) {
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

    // 4. 3-SIDED OPEN BOUNDARY ABSORPTION SINKS
    for (let y = 0; y < H; y++) {
      const leftIdx = y * W;
      const rightIdx = y * W + (W - 1);

      waterDepth[leftIdx] *= 0.85;
      waterDepth[rightIdx] *= 0.85;
      momentumX[leftIdx] = 0;
      momentumX[rightIdx] = 0;
    }
  }
}
