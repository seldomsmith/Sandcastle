/**
 * Sandcastle vs. Tide Simulator - Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Features incremental wave train progression across beach over 60s,
 * virtual pipe flux solving, and Flather radiation absorption.
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
    const pipeFactor = (dt * g * PIPE_CROSS_SECTION) / VIRTUAL_PIPE_LENGTH;
    const cellArea = dx * dx;

    // 1. INCREMENTAL WAVE TRAIN ADVANCEMENT (60-second total beach traversal at 1x)
    // Seaward boundary at Y = 0 (ocean side)
    const timeSec = frame * dt;
    this.wavePhase += (2.0 * Math.PI * dt) / 4.0; // 4-second wave cycle

    // Base tide sea level rises slowly over 60 seconds
    const maxTideDepth = 0.35;
    const tideProgress = Math.min(1.0, timeSec / 60.0);
    const baseSea = scenario.baseSeaLevel + (tideProgress * maxTideDepth);

    // Wave pulses: Each wave delivers an incremental surge packet
    const wavePulse = Math.pow(Math.max(0, Math.sin(this.wavePhase)), 3.0) * scenario.waveAmplitude * 0.8;

    for (let x = 0; x < W; x++) {
      const idx = x; // Y = 0 row (Ocean front)
      const targetWaterHeight = Math.max(0.0, baseSea + wavePulse - bedHeight[idx]);
      
      const celerity = Math.sqrt(g * Math.max(MIN_WATER_DEPTH, targetWaterHeight));
      waterDepth[idx] = targetWaterHeight;
      momentumY[idx] = targetWaterHeight * celerity * 0.8;
    }

    // 2. PIPE FLUX COMPUTATION
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

        // Direct wave momentum forward bias towards North shore (Y direction)
        if (momentumY[idx] > 0) {
          fT += momentumY[idx] * pipeFactor * 0.3;
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

    // 4. 3-SIDED OPEN BOUNDARY ABSORPTION SINKS (X=0, X=W-1, Y=H-1)
    for (let y = 0; y < H; y++) {
      const leftIdx = y * W;
      const rightIdx = y * W + (W - 1);

      waterDepth[leftIdx] *= 0.85;
      waterDepth[rightIdx] *= 0.85;
      momentumX[leftIdx] = 0;
      momentumX[rightIdx] = 0;
    }

    for (let x = 0; x < W; x++) {
      const topIdx = (H - 1) * W + x;
      waterDepth[topIdx] *= 0.85;
      momentumY[topIdx] = 0;
    }
  }
}
