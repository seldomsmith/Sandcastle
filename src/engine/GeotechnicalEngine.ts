/**
 * Sandcastle vs. Tide Simulator - Geotechnical & Erosion Engine
 *
 * Handles hydrodynamic shear detachment, sediment transport capacity,
 * sand saturation diffusion, 90-degree vertical wall block chunk fractures, and wet-molded sand structural stiffness.
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
  private deltaSand: Float32Array;
  private maxDeltaSlope: Float32Array;

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
   * Performs water saturation diffusion, shear detachment, 90-degree wall chunk shear failure, and slumping updates.
   */
  public step(buffers: SharedSimulationBuffers): void {
    const { bedHeight, waterDepth, momentumX, momentumY, compaction, saturation, materialFlags } = buffers;

    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const dt = DT;
    const cellDistUnit = CELL_SIZE;

    this.deltaSand.fill(0.0);

    // 1. SATURATION, SHELL ARMOR & HYDRODYNAMIC DETACHMENT
    for (let i = 0; i < CELL_COUNT; i++) {
      const h = waterDepth[i];
      const mat = materialFlags[i];

      // Skip non-erodible stone bedrock (Flag 1.0)
      if (mat === 1.0) continue;

      if (h > MIN_WATER_DEPTH) {
        saturation[i] = Math.min(1.0, saturation[i] + DISSOLUTION_RATE * 2.5 * dt);
      } else {
        saturation[i] = Math.max(0.0, saturation[i] - DISSOLUTION_RATE * 0.2 * dt);
      }

      if (h > MIN_WATER_DEPTH) {
        const mx = momentumX[i];
        const my = momentumY[i];
        const speed = Math.sqrt(mx * mx + my * my) / h;

        // Seashell armor (Flag 4.0) increases detachment resistance 3.5x
        const armorFactor = mat === 4.0 ? 3.5 : 1.0;
        const effectiveCriticalShear = CRITICAL_SHEAR_DETACHMENT * (1.0 + compaction[i] * 1.5) * armorFactor;

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

    for (let i = 0; i < CELL_COUNT; i++) {
      bedHeight[i] = Math.max(BEDROCK_ELEVATION, bedHeight[i] + this.deltaSand[i]);
    }

    // 2. WET-MOLDED SAND STIFFNESS & SLUMPING SOLVER
    this.deltaSand.fill(0.0);

    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;
      for (let x = 0; x < W; x++) {
        const idx = rowOffset + x;
        const zb0 = bedHeight[idx];
        const mat = materialFlags[idx];

        if (zb0 <= BEDROCK_ELEVATION || mat === 1.0) continue;

        const sat = saturation[idx];
        const comp = compaction[idx];
        const h = waterDepth[idx];

        // 90-degree wall (Flag 2.0): When undercut by water, fractures in discrete rectangular chunks
        if (mat === 2.0 && (h > MIN_WATER_DEPTH || sat > 0.4)) {
          let lowestNeighborIdx = -1;
          let lowestNeighborHeight = zb0;

          for (let n = 0; n < 4; n++) {
            const nx = x + this.dx[n];
            const ny = y + this.dy[n];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
              const nIdx = ny * W + nx;
              if (bedHeight[nIdx] < lowestNeighborHeight) {
                lowestNeighborHeight = bedHeight[nIdx];
                lowestNeighborIdx = nIdx;
              }
            }
          }

          if (lowestNeighborIdx !== -1 && (zb0 - lowestNeighborHeight) > 0.08) {
            const chunkVolume = Math.min(zb0 - BEDROCK_ELEVATION, 0.12);
            this.deltaSand[idx] -= chunkVolume;
            this.deltaSand[targetNeighborIdx || lowestNeighborIdx] += chunkVolume;
            materialFlags[idx] = 0.0;
            continue;
          }
        }

        // Wet-Molded Sand Angle of Repose:
        // Compacted wet sand (comp > 0.7) holds crisp steep 75-85 degree walls!
        // Loose dry sand or submerged wet sand slumps to 8-30 degrees.
        let targetReposeAngle = DRY_ANGLE_OF_REPOSE;
        if (h > MIN_WATER_DEPTH || sat > 0.6) {
          targetReposeAngle = SATURATED_ANGLE_OF_REPOSE * 0.7; // ~8 degrees for submerged/liquefied sand
        } else {
          // High compaction wet sand retains steep bucket turret walls (~80 degrees!)
          const steepnessFactor = Math.pow(comp, 2.0);
          targetReposeAngle = DRY_ANGLE_OF_REPOSE + steepnessFactor * (1.40 - DRY_ANGLE_OF_REPOSE); // Up to ~82 degrees
        }

        const maxAllowedSlope = Math.tan(targetReposeAngle);

        let maxExcessSlope = 0.0;
        let targetNeighborIdx = -1;
        let targetNeighborDist = 1.0;

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

        if (targetNeighborIdx !== -1 && maxExcessSlope > 0) {
          const excessHeight = (maxExcessSlope - maxAllowedSlope) * targetNeighborDist * 0.4;
          const transferVolume = Math.min(zb0 - BEDROCK_ELEVATION, excessHeight);

          this.deltaSand[idx] -= transferVolume;
          this.deltaSand[targetNeighborIdx] += transferVolume;
        }
      }
    }

    for (let i = 0; i < CELL_COUNT; i++) {
      if (this.deltaSand[i] !== 0) {
        bedHeight[i] = Math.max(BEDROCK_ELEVATION, bedHeight[i] + this.deltaSand[i]);
      }
    }
  }
}
