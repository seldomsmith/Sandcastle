/**
 * Sandcastle vs. Tide Simulator - Extended Piped-Flow Hydrodynamic Solver
 *
 * Implements an Extended Piped-Flow Cellular Automaton (EPF-CA) fluid engine.
 * Features strict outflow scaling safety factor (0.5 max outflow volume), velocity clamping (2.0 m/s),
 * Laplacian spatial diffusion filter (nu = 0.15) for spire elimination, and dynamic Manning friction scaling.
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
  private smoothDepthBuffer: Float32Array;

  private waveGenerator: WaveGenerator;

  constructor() {
    this.fluxR = new Float32Array(CELL_COUNT);
    this.fluxL = new Float32Array(CELL_COUNT);
    this.fluxT = new Float32Array(CELL_COUNT);
    this.fluxB = new Float32Array(CELL_COUNT);
    this.deltaDepth = new Float32Array(CELL_COUNT);
    this.smoothDepthBuffer = new Float32Array(CELL_COUNT);

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

    // 1. DISCRETE PERIODIC WAVE CYCLE BOUNDARY UPDATE (Row Y = 0)
    this.waveGenerator.updateBoundary(buffers, scenario, simTime);

    // 2. PIPE FLUX COMPUTATION WITH STRICT 0.5 OUTFLOW SAFETY SCALING
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

        // Dynamic Manning Wet-Bed Friction Scaling
        const sat = saturation[idx];
        const isWet = sat > 0.7 || h0 > 0.005;
        const frictionCoeff = isWet ? 0.012 : 0.06;
        const frictionDamping = Math.max(0.2, 1.0 - frictionCoeff * dt * 10.0);

        const localPipeFactor = basePipeFactor * frictionDamping;

        let fR = Math.max(0, this.fluxR[idx] + localPipeFactor * (totalHead0 - totalHeadR));
        let fL = Math.max(0, this.fluxL[idx] + localPipeFactor * (totalHead0 - totalHeadL));
        let fT = Math.max(0, this.fluxT[idx] + localPipeFactor * (totalHead0 - totalHeadT));
        let fB = Math.max(0, this.fluxB[idx] + localPipeFactor * (totalHead0 - totalHeadB));

        // Momentum advection
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

        // Maximum Outflow Scaling: sum(F_out) * dt <= h_cell * Area * 0.5 (Strict safety factor of 0.5 to prevent spires)
        const totalOutflowVolume = (fR + fL + fT + fB) * dt;
        const maxSafeOutflowVolume = h0 * cellArea * 0.5;

        if (totalOutflowVolume > maxSafeOutflowVolume && totalOutflowVolume > 0) {
          const scale = maxSafeOutflowVolume / totalOutflowVolume;
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

    // 3. WATER DEPTH & VELOCITY UPDATE WITH MAX VELOCITY CLAMPING (2.0 m/s)
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

        // Maximum Velocity Clamp: max(|u|, |v|) <= 2.0 m/s
        let ux = (((inR - fL) + (fR - inL)) * 0.5) / dx;
        let uy = (((inT - fB) + (fT - inB)) * 0.5) / dx;

        const maxVel = 2.0;
        ux = Math.max(-maxVel, Math.min(maxVel, ux));
        uy = Math.max(-maxVel, Math.min(maxVel, uy));

        momentumX[idx] = ux * waterDepth[idx];
        momentumY[idx] = uy * waterDepth[idx];
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

    // 4. LAPLACIAN SMOOTHING / VISCOSITY FILTER (nu = 0.15)
    const nu = 0.15;
    this.smoothDepthBuffer.set(waterDepth);

    for (let y = 1; y < H - 1; y++) {
      const rowOffset = y * W;
      for (let x = 1; x < W - 1; x++) {
        const idx = rowOffset + x;
        const hC = this.smoothDepthBuffer[idx];
        if (hC < MIN_WATER_DEPTH) continue;

        const hL = this.smoothDepthBuffer[idx - 1];
        const hR = this.smoothDepthBuffer[idx + 1];
        const hB = this.smoothDepthBuffer[idx - W];
        const hT = this.smoothDepthBuffer[idx + W];

        const laplacianAvg = (hL + hR + hB + hT) * 0.25;
        waterDepth[idx] = hC + nu * (laplacianAvg - hC);
      }
    }
  }
}
