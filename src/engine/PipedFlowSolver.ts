/**
 * Sandcastle vs. Tide Simulator - Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Features continuous smooth shallow fluid sheet flow, moat pooling, incremental wave swash packets,
 * and open ocean boundary drainage.
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
    const pipeFactor = (dt * g * PIPE_CROSS_SECTION * 0.15) / VIRTUAL_PIPE_LENGTH;
    const cellArea = dx * dx;

    // 1. INCREMENTAL WAVE SWASH PACKETS & CONTINUOUS BEACH POOLING
    const timeSec = tideFrame * dt;
    this.wavePhase += (2.0 * Math.PI * dt) / 4.0; // 4-second wave cycle

    const swashPulse = Math.sin(this.wavePhase);
    const isSwash = swashPulse > 0;

    // Tide progress: 0.0 at T=0s -> 1.0 at T=30s
    const tideProgress = Math.min(1.0, timeSec / 30.0);
    
    // Each wave advances step-by-step up the beach
    const waveIndex = Math.floor(timeSec / 4.0);
    const waveStepReachY = Math.min(H - 1, 15 + waveIndex * 16);

    const activeSwashReachY = isSwash
      ? Math.min(H - 1, waveStepReachY + Math.floor(swashPulse * 14))
      : Math.max(0, waveStepReachY - Math.floor(Math.abs(swashPulse) * 10));

    // Dynamic base sea level rises gradually behind the wave front
    const baseSeaElevation = 0.02 + tideProgress * 0.25;

    // Inject ocean wave pulse at seaward boundary (Y = 0)
    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 row (Ocean boundary)
      const targetDepth = Math.max(0.01, Math.min(0.12, baseSeaElevation - bedHeight[idx] + (isSwash ? swashPulse * 0.03 : 0.0)));

      if (isSwash) {
        waterDepth[idx] = targetDepth;
        momentumY[idx] = targetDepth * 0.2 * swashPulse;
      } else {
        waterDepth[idx] *= 0.7; // Drain backwash into ocean
        momentumY[idx] = -targetDepth * 0.2 * Math.abs(swashPulse);
      }
    }

    // 2. PIPE FLUX COMPUTATION (Continuous fluid sheet flow without dry gaps)
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

        let fR = Math.max(0, this.fluxR[idx] + pipeFactor * (totalHead0 - totalHeadR));
        let fL = Math.max(0, this.fluxL[idx] + pipeFactor * (totalHead0 - totalHeadL));
        let fT = Math.max(0, this.fluxT[idx] + pipeFactor * (totalHead0 - totalHeadT));
        let fB = Math.max(0, this.fluxB[idx] + pipeFactor * (totalHead0 - totalHeadB));

        // Prevent flow beyond active swash reach front
        if (y > activeSwashReachY) {
          fT = 0;
        }

        if (momentumY[idx] > 0) {
          fT += momentumY[idx] * pipeFactor * 0.2;
        } else if (momentumY[idx] < 0) {
          fB += Math.abs(momentumY[idx]) * pipeFactor * 0.25;
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

    // 3. WATER DEPTH & MOMENTUM UPDATE WITH STRICT 12CM DEPTH CLAMPING
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

      // Clamp water depth to realistic max 12cm fluid sheet (prevents vertical blue spires!)
      if (hNew > 0.12) {
        hNew = 0.12;
      }

      if (hNew < MIN_WATER_DEPTH) {
        hNew = 0.0;
        momentumX[i] = 0.0;
        momentumY[i] = 0.0;
      }
      waterDepth[i] = hNew;
    }
  }
}
