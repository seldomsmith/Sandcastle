/**
 * Sandcastle vs. Tide Simulator - Multi-Layer Culvert Engine
 *
 * Simulates subsurface conduit pipe flow (h_pipe, Q_pipe) beneath sand tunnel roofs.
 * Evaluates structural roof collapse rules based on roof thickness, compaction, and moisture saturation.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_COUNT,
  DT,
  GRAVITY,
  BEDROCK_ELEVATION
} from '../config/constants';
import { SharedSimulationBuffers } from '../types/simulation';

export class CulvertEngine {
  private tunnelRoofHeight: Float32Array;
  private pipeWaterDepth: Float32Array;

  constructor() {
    this.tunnelRoofHeight = new Float32Array(CELL_COUNT);
    this.pipeWaterDepth = new Float32Array(CELL_COUNT);
    this.tunnelRoofHeight.fill(0.0);
    this.pipeWaterDepth.fill(0.0);
  }

  /**
   * Performs subsurface conduit flow and roof collapse evaluation.
   */
  public step(buffers: SharedSimulationBuffers): void {
    const { bedHeight, waterDepth, compaction, saturation, materialFlags } = buffers;
    const dt = DT;

    for (let i = 0; i < CELL_COUNT; i++) {
      const roofThick = this.tunnelRoofHeight[i];
      if (roofThick <= 0.0) continue;

      const comp = compaction[i];
      const sat = saturation[i];

      // Unreinforced sand tunnel roof collapse criteria:
      // Collapse occurs if roof thickness < 0.08m, compaction < 0.7, or saturation > 0.85
      const isStone = materialFlags[i] === 1.0;
      const isUnstable = !isStone && (roofThick < 0.08 || comp < 0.7 || sat > 0.85);

      if (isUnstable) {
        // Instant roof collapse: collapse roof sand into open trench
        bedHeight[i] = Math.max(BEDROCK_ELEVATION, bedHeight[i] - roofThick);
        this.tunnelRoofHeight[i] = 0.0;
        this.pipeWaterDepth[i] = 0.0;
      }
    }
  }
}
