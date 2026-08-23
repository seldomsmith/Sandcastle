/**
 * Sandcastle vs. Tide Simulator - Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Computes inter-cell virtual pipe fluxes, volume conservation scaling,
 * 3-sided open boundary absorption sinks, wave generation, and Flather radiation condition.
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
  // Pre-allocated scratch buffers to guarantee ZERO allocations during tick loops
  private fluxR: Float32Array; // Rightward flux out of cell (m^3/s)
  private fluxL: Float32Array; // Leftward flux out of cell (m^3/s)
  private fluxT: Float32Array; // Topward flux out of cell (m^3/s)
  private fluxB: Float32Array; // Bottomward flux out of cell (m^3/s)
  private deltaDepth: Float32Array; // Water depth delta per step

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

    // 1. WAVE INJECTION & FLATHER RADIATION ABSORPTION AT Y = 0
    this.wavePhase += (2.0 * Math.PI * dt) / scenario.wavePeriod;
    if (this.wavePhase > 2.0 * Math.PI) {
      this.wavePhase -= 2.0 * Math.PI;
    }

    // Superposed offshore wave spectrum at Y = 0 (South boundary)
    const baseSea = scenario.baseSeaLevel + (frame * scenario.tideRiseRate * dt);
    const waveAmp = scenario.waveAmplitude;

    for (let x = 0; x < W; x++) {
      const idx = x; // y = 0
      const totalElevation = bedHeight[idx] + waterDepth[idx];
      const targetWaterHeight = Math.max(0.0, baseSea + Math.sin(this.wavePhase + x * 0.15) * waveAmp - bedHeight[idx]);
      
      // Flather radiation condition: absorption of outward propagating disturbances
      const targetVel = Math.sqrt(g * Math.max(MIN_WATER_DEPTH, waterDepth[idx]));
      const inflowDepth = 0.8 * waterDepth[idx] + 0.2 * targetWaterHeight;
      waterDepth[idx] = inflowDepth;
      momentumY[idx] = inflowDepth * targetVel;
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

        // Neighbor elevation heads
        const totalHeadR = (x < W - 1) ? bedHeight[idx + 1] + waterDepth[idx + 1] : totalHead0;
        const totalHeadL = (x > 0) ? bedHeight[idx - 1] + waterDepth[idx - 1] : totalHead0;
        const totalHeadT = (y < H - 1) ? bedHeight[idx + W] + waterDepth[idx + W] : totalHead0;
        const totalHeadB = (y > 0) ? bedHeight[idx - W] + waterDepth[idx - W] : totalHead0;

        // Hydrostatic pressure head differences
        let fR = Math.max(0, this.fluxR[idx] + pipeFactor * (totalHead0 - totalHeadR));
        let fL = Math.max(0, this.fluxL[idx] + pipeFactor * (totalHead0 - totalHeadL));
        let fT = Math.max(0, this.fluxT[idx] + pipeFactor * (totalHead0 - totalHeadT));
        let fB = Math.max(0, this.fluxB[idx] + pipeFactor * (totalHead0 - totalHeadB));

        // Volume scaling to prevent negative water volume
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

        // Inflows from neighbors
        const inR = (x > 0) ? this.fluxR[idx - 1] : 0;
        const inL = (x < W - 1) ? this.fluxL[idx + 1] : 0;
        const inT = (y > 0) ? this.fluxT[idx - W] : 0;
        const inB = (y < H - 1) ? this.fluxB[idx + W] : 0;

        const totalInflow = inR + inL + inT + inB;
        const netVolumeChange = (totalInflow - totalOutflow) * dt;

        this.deltaDepth[idx] = netVolumeChange / cellArea;

        // Net horizontal momentum component calculations
        const netUx = ((inR - fL) + (fR - inL)) * 0.5;
        const netUy = ((inT - fB) + (fT - inB)) * 0.5;

        momentumX[idx] = netUx / dx;
        momentumY[idx] = netUy / dx;
      }
    }

    // Apply depth updates and wetting/drying thresholds
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

      // Sponge / absorber layer for X boundaries
      waterDepth[leftIdx] *= 0.85;
      waterDepth[rightIdx] *= 0.85;
      momentumX[leftIdx] = 0;
      momentumX[rightIdx] = 0;
    }

    for (let x = 0; x < W; x++) {
      const topIdx = (H - 1) * W + x;
      // Absorbing boundary at North shore
      waterDepth[topIdx] *= 0.85;
      momentumY[topIdx] = 0;
    }
  }
}
