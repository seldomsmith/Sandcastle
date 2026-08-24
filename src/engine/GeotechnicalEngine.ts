/**
 * Sandcastle vs. Tide Simulator - Geotechnical & Erosion Engine
 *
 * Handles hydrodynamic shear detachment, sediment transport capacity,
 * sand saturation diffusion, and 8-neighbour angle-of-repose slumping with distance weighting.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_COUNT,
  CELL_SIZE,
  DT,
  BEDROCK_ELEVATION,
  MIN_WATER_DEPTH,
  DRY_ANGLE_OF_REPOSE,
  WET_ANGLE_OF_REPOSE,
  SATURATED_ANGLE_OF_REPOSE,
  CRITICAL_SHEAR_DETACHMENT,
  SEDIMENT_CAPACITY_COEFF,
  DISSOLUTION_RATE
} from '../config/constants';
import { SharedSimulationBuffers } from '../types/simulation';

export class GeotechnicalEngine {
  // Pre-allocated scratch arrays to eliminate GC overhead in tick
  private deltaSand: Float32Array;
  private maxDeltaSlope: Float32Array;

  // 8-Neighbour stencil offsets: Orthogonal [0..3], Diagonal [4..7]
  private dx: Int32Array = new Int32Array([1, -1, 0, 0, 1, -1, 1, -1]);
  private dy: Int32Array = new Int32Array([0, 0, 1, -1, 1, 1, -1, -1]);
  private dist: Float32Array = new Float32Array([
    1.0, 1.0, 1.0, 1.0,
    1.41421356, 1.41421356, 1.41421356, 1.41421356
  ]);

  constructor() {
    this.deltaSand = new Float32Array(CELL_COUNT);
    this.maxDeltaSlope = new Float32Array(CELL_COUNT);
  }

  /**
   * Performs water saturation diffusion and geotechnical detachment + slumping updates.
   */
  public step(buffers: SharedSimulationBuffers): void {
    const { bedHeight, waterDepth, momentumX, momentumY, compaction, saturation, materialFlags } = buffers;

    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const dt = DT;
    const cellDistUnit = CELL_SIZE;

    this.deltaSand.fill(0.0);

    // 1. SATURATION & HYDRODYNAMIC SHEAR DETACHMENT
    for (let i = 0; i < CELL_COUNT; i++) {
      const h = waterDepth[i];
      const isStone = materialFlags[i] === 1.0;

      // Skip non-erodible stone bedrock
      if (isStone) continue;

      // Update sand saturation level based on water column depth
      if (h > MIN_WATER_DEPTH) {
        saturation[i] = Math.min(1.0, saturation[i] + DISSOLUTION_RATE * 2.5 * dt);
      } else {
        saturation[i] = Math.max(0.0, saturation[i] - DISSOLUTION_RATE * 0.2 * dt);
      }

      // Calculate hydrodynamic shear stress |u| = sqrt(mx^2 + my^2) / h
      if (h > MIN_WATER_DEPTH) {
        const mx = momentumX[i];
        const my = momentumY[i];
        const speed = Math.sqrt(mx * mx + my * my) / h;

        // Shear detachment threshold scaled by compaction
        const effectiveCriticalShear = CRITICAL_SHEAR_DETACHMENT * (1.0 + compaction[i] * 1.5);

        if (speed > effectiveCriticalShear) {
          const excessShear = speed - effectiveCriticalShear;
          const capacity = SEDIMENT_CAPACITY_COEFF * excessShear * h * 2.0;
          const erosionAmount = Math.min(bedHeight[i] - BEDROCK_ELEVATION, capacity * dt);

          if (erosionAmount > 0) {
            this.deltaSand[i] -= erosionAmount;
          }
        }
      }
    }

    // Apply shear detachment deltas
    for (let i = 0; i < CELL_COUNT; i++) {
      bedHeight[i] = Math.max(BEDROCK_ELEVATION, bedHeight[i] + this.deltaSand[i]);
    }

    // 2. 8-NEIGHBOUR ANGLE-OF-REPOSE SLUMPING (Liquefaction & Collapse)
    this.deltaSand.fill(0.0);

    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;
      for (let x = 0; x < W; x++) {
        const idx = rowOffset + x;
        const zb0 = bedHeight[idx];

        if (zb0 <= BEDROCK_ELEVATION || materialFlags[idx] === 1.0) continue;

        // Dynamic angle of repose based on wetness and compaction
        const sat = saturation[idx];
        const comp = compaction[idx];
        const h = waterDepth[idx];

        // Saturated or submerged sand liquefies and slumps rapidly at ~8-12 degrees
        let targetReposeAngle = DRY_ANGLE_OF_REPOSE;
        if (h > MIN_WATER_DEPTH || sat > 0.6) {
          targetReposeAngle = SATURATED_ANGLE_OF_REPOSE * 0.7; // ~8 degrees for submerged sand
        } else {
          targetReposeAngle = DRY_ANGLE_OF_REPOSE + comp * (WET_ANGLE_OF_REPOSE - DRY_ANGLE_OF_REPOSE);
        }

        const maxAllowedSlope = Math.tan(targetReposeAngle);

        let maxExcessSlope = 0.0;
        let targetNeighborIdx = -1;
        let targetNeighborDist = 1.0;

        // Evaluate all 8 neighbors
        for (let n = 0; n < 8; n++) {
          const nx = x + this.dx[n];
          const ny = y + this.dy[n];

          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const nIdx = ny * W + nx;
            const nZb = bedHeight[nIdx];
            const distance = this.dist[n] * cellDistUnit;

            const slope = (zb0 - nZb) / distance;
            if (slope > maxAllowedSlope && slope > maxExcessSlope) {
              maxExcessSlope = slope;
              targetNeighborIdx = nIdx;
              targetNeighborDist = distance;
            }
          }
        }

        // Transfer sand volume down the steepest unstable slope gradient
        if (targetNeighborIdx !== -1 && maxExcessSlope > 0) {
          const excessHeight = (maxExcessSlope - maxAllowedSlope) * targetNeighborDist * 0.6;
          const transferVolume = Math.min(zb0 - BEDROCK_ELEVATION, excessHeight);

          this.deltaSand[idx] -= transferVolume;
          this.deltaSand[targetNeighborIdx] += transferVolume;
        }
      }
    }

    // Apply slumping changes
    for (let i = 0; i < CELL_COUNT; i++) {
      if (this.deltaSand[i] !== 0) {
        bedHeight[i] = Math.max(BEDROCK_ELEVATION, bedHeight[i] + this.deltaSand[i]);
      }
    }
  }
}
