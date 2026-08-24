/**
 * Sandcastle vs. Tide Simulator - Subsurface Culvert Engine
 *
 * Simulates subterranean pipe flow through placed culvert conduit channels.
 * Channels water volume safely beneath sand structures and handles roof collapse if undercut.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_COUNT,
  CELL_SIZE,
  DT,
  GRAVITY,
  BEDROCK_ELEVATION,
  MIN_WATER_DEPTH
} from '../config/constants';
import { SharedSimulationBuffers } from '../types/simulation';

export class CulvertEngine {
  /**
   * Process subsurface pipe culvert water routing.
   * Material flag 3.0 indicates culvert pipe conduit.
   */
  public step(buffers: SharedSimulationBuffers): void {
    const { bedHeight, waterDepth, materialFlags } = buffers;
    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const dt = DT;

    for (let y = 1; y < H - 1; y++) {
      const rowOffset = y * W;
      for (let x = 1; x < W - 1; x++) {
        const idx = rowOffset + x;

        // Check if cell is a subsurface culvert pipe (flag == 3.0)
        if (materialFlags[idx] === 3.0) {
          const hIn = waterDepth[idx];
          if (hIn > MIN_WATER_DEPTH) {
            // Conduit channel transfers water rapidly northward (+Y direction) to back basin
            const outIdx = (y + 2) * W + x;
            if (outIdx < CELL_COUNT) {
              const transferVolume = Math.min(hIn, 0.05 * dt);
              waterDepth[idx] -= transferVolume;
              waterDepth[outIdx] += transferVolume;
            }
          }

          // If sand above culvert is heavily eroded, roof collapses
          if (bedHeight[idx] <= BEDROCK_ELEVATION + 0.02) {
            materialFlags[idx] = 0.0; // Roof collapsed into open sand channel
          }
        }
      }
    }
  }
}
