/**
 * Sandcastle vs. Tide Simulator - Web Worker Simulation Engine
 *
 * Dedicated worker thread execution context running the Extended Piped-Flow hydrodynamics,
 * geotechnical detachment, 90-degree wall block shear, wet sand turret bucket stamp, and atomic sync loop.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_COUNT,
  MAX_BUILD_HEIGHT,
  BEDROCK_ELEVATION,
  CONTROL_STATE_FLAGS,
  CONTROL_FRAME_COUNTER,
  CONTROL_TOOL_ACTIVE,
  CONTROL_TOOL_TYPE,
  CONTROL_TOOL_X,
  CONTROL_TOOL_Y,
  CONTROL_TOOL_RADIUS,
  CONTROL_TOOL_STRENGTH
} from '../config/constants';
import {
  SimCommand,
  ToolType,
  WorkerMessageRequest,
  WorkerMessageResponse,
  ScenarioConfig,
  SharedSimulationBuffers
} from '../types/simulation';
import { SharedMemoryManager } from './SharedMemory';
import { PipedFlowSolver } from './PipedFlowSolver';
import { GeotechnicalEngine } from './GeotechnicalEngine';
import { CulvertEngine } from './CulvertEngine';

// Worker Context State Variables
let buffers: SharedSimulationBuffers | null = null;
let isSharedBuffer: boolean = false;
let isRunning: boolean = false;
let frameCounter: number = 0;
let tideFrameCounter: number = 0;
let speedMultiplier: number = 1.0;
let loopInterval: number | null = null;

const pipedFlowSolver = new PipedFlowSolver();
const geotechnicalEngine = new GeotechnicalEngine();
const culvertEngine = new CulvertEngine();

// Default Simulation Scenario Parameters
const scenario: ScenarioConfig = {
  waveAmplitude: 0.10,
  wavePeriod: 5.0,
  tideRiseRate: 0.00008,
  baseSeaLevel: 0.05,
  windVelocityX: 0.2,
  windVelocityY: 0.1,
  sedimentCohesion: 0.6
};

/**
 * Message Event Listener Handler
 */
self.onmessage = (event: MessageEvent<WorkerMessageRequest>) => {
  const message = event.data;

  switch (message.type) {
    case SimCommand.INIT: {
      const { sharedBuffer, isShared } = message.payload;
      isSharedBuffer = isShared;
      buffers = SharedMemoryManager.wrapBuffers(sharedBuffer);

      // Reset initial values
      initializeTerrain(buffers);

      sendResponse({ type: 'READY', payload: { isShared } });
      startSimulationLoop();
      break;
    }

    case SimCommand.START_TIDE: {
      isRunning = true;
      if (buffers) {
        SharedMemoryManager.atomicWrite(buffers.controlBuffer, CONTROL_STATE_FLAGS, 1);
      }
      break;
    }

    case SimCommand.PAUSE_TIDE: {
      isRunning = false;
      if (buffers) {
        SharedMemoryManager.atomicWrite(buffers.controlBuffer, CONTROL_STATE_FLAGS, 0);
      }
      break;
    }

    case SimCommand.STEP: {
      if (buffers) {
        executeSimulationTick();
      }
      break;
    }

    case SimCommand.APPLY_TOOL: {
      if (buffers) {
        applyToolBrush(buffers, message.payload);
      }
      break;
    }

    case SimCommand.SET_SCENARIO: {
      if (message.payload.wavePeriod !== undefined) {
        speedMultiplier = 5.0 / message.payload.wavePeriod;
      }
      Object.assign(scenario, message.payload);
      break;
    }

    case SimCommand.RESET: {
      if (buffers) {
        initializeTerrain(buffers);
        frameCounter = 0;
        tideFrameCounter = 0;
      }
      break;
    }
  }
};

/**
 * Sends typed response back to main thread.
 */
function sendResponse(response: WorkerMessageResponse): void {
  self.postMessage(response);
}

/**
 * Initialize flat beach terrain (sloping gently from 0.02m at seaward Y=0 to 0.08m at upper beach Y=255).
 * Removes any default central sand mound.
 */
function initializeTerrain(buf: SharedSimulationBuffers): void {
  const { bedHeight, waterDepth, momentumX, momentumY, compaction, saturation, materialFlags } = buf;

  const W = GRID_WIDTH;
  const H = GRID_HEIGHT;

  for (let y = 0; y < H; y++) {
    const rowOffset = y * W;
    const slopeHeight = BEDROCK_ELEVATION + 0.02 + (y / H) * 0.06; // Gentle flat beach slope (0.02m -> 0.08m)

    for (let x = 0; x < W; x++) {
      const idx = rowOffset + x;

      bedHeight[idx] = slopeHeight;
      compaction[idx] = 0.5;
      saturation[idx] = y < H * 0.15 ? 0.4 : 0.1; // Slightly damp near ocean edge, dry sand on upper beach face

      waterDepth[idx] = 0.0;
      momentumX[idx] = 0.0;
      momentumY[idx] = 0.0;
      materialFlags[idx] = 0.0; // Standard sand
    }
  }
}

/**
 * Applies interactive raycast tool brushes to the grid.
 */
function applyToolBrush(buf: SharedSimulationBuffers, tool: { type: ToolType; x: number; y: number; radius: number; strength: number }): void {
  const { bedHeight, compaction, saturation, materialFlags } = buf;
  const W = GRID_WIDTH;
  const H = GRID_HEIGHT;

  const cx = Math.floor(tool.x);
  const cy = Math.floor(tool.y);
  const r = Math.ceil(tool.radius);

  for (let dy = -r; dy <= r; dy++) {
    const py = cy + dy;
    if (py < 0 || py >= H) continue;

    for (let dx = -r; dx <= r; dx++) {
      const px = cx + dx;
      if (px < 0 || px >= W) continue;

      const distSq = dx * dx + dy * dy;
      if (distSq > tool.radius * tool.radius) continue;

      const idx = py * W + px;
      const falloff = 1.0 - Math.sqrt(distSq) / tool.radius;
      const delta = tool.strength * falloff;

      switch (tool.type) {
        case ToolType.RAISE:
          bedHeight[idx] = Math.min(MAX_BUILD_HEIGHT, bedHeight[idx] + delta);
          compaction[idx] = Math.min(0.9, compaction[idx] + delta);
          saturation[idx] = Math.min(0.4, saturation[idx] + 0.1);
          break;

        case ToolType.DIG:
          bedHeight[idx] = Math.max(BEDROCK_ELEVATION, bedHeight[idx] - delta);
          break;

        case ToolType.COMPACT:
          compaction[idx] = Math.min(1.0, compaction[idx] + delta * 2.0);
          saturation[idx] = Math.min(0.5, saturation[idx] + 0.1);
          break;

        case ToolType.STONE:
          materialFlags[idx] = 1.0; // Rigid non-erodible stone
          compaction[idx] = 1.0;
          break;

        case ToolType.WALL_90:
          bedHeight[idx] = Math.min(MAX_BUILD_HEIGHT, bedHeight[idx] + delta * 1.8);
          materialFlags[idx] = 2.0; // 90-Degree wall flag for chunk collapse
          compaction[idx] = 0.95;
          saturation[idx] = 0.45;
          break;

        case ToolType.BUCKET: {
          const bucketR = Math.max(3, tool.radius);
          const distBucket = Math.sqrt(distSq);
          if (distBucket <= bucketR) {
            const isCrenellation = (Math.atan2(dy, dx) * 4) % 1.0 > 0.5;
            const towerHeight = 0.28 + (isCrenellation ? 0.05 : 0.0);
            bedHeight[idx] = Math.min(MAX_BUILD_HEIGHT, bedHeight[idx] + towerHeight);
            compaction[idx] = 1.0;
            saturation[idx] = 0.50;
          }
          break;
        }

        case ToolType.CULVERT:
          materialFlags[idx] = 3.0;
          compaction[idx] = 0.95;
          break;

        case ToolType.SHELLS:
          materialFlags[idx] = 4.0;
          compaction[idx] = 0.95;
          break;
      }
    }
  }
}

/**
 * Process atomic lock and control signals from main thread.
 */
function processControlSignals(buf: SharedSimulationBuffers): void {
  const control = buf.controlBuffer;
  const isToolActive = SharedMemoryManager.atomicRead(control, CONTROL_TOOL_ACTIVE);

  if (isToolActive === 1) {
    const type = SharedMemoryManager.atomicRead(control, CONTROL_TOOL_TYPE) as ToolType;
    const x = SharedMemoryManager.atomicRead(control, CONTROL_TOOL_X);
    const y = SharedMemoryManager.atomicRead(control, CONTROL_TOOL_Y);
    const radius = SharedMemoryManager.atomicRead(control, CONTROL_TOOL_RADIUS);
    const strength = SharedMemoryManager.atomicRead(control, CONTROL_TOOL_STRENGTH) / 1000.0;

    applyToolBrush(buf, { type, x, y, radius, strength });
    SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_ACTIVE, 0);
  }
}

/**
 * Primary 60 Hz physics tick execution step with sub-stepping for speed control.
 */
function executeSimulationTick(): void {
  if (!buffers) return;

  const tStart = performance.now();

  processControlSignals(buffers);

  const lockAcquired = SharedMemoryManager.acquireLock(buffers.controlBuffer);
  if (!lockAcquired) return;

  try {
    const subSteps = Math.max(1, Math.round(speedMultiplier));
    const isHalfSpeed = speedMultiplier < 0.75;

    for (let step = 0; step < subSteps; step++) {
      if (isHalfSpeed && frameCounter % 2 !== 0) continue;

      if (isRunning) {
        tideFrameCounter++;
        pipedFlowSolver.step(buffers, scenario, tideFrameCounter);
      }

      geotechnicalEngine.step(buffers);
      culvertEngine.step(buffers);
    }

    frameCounter++;
    SharedMemoryManager.atomicWrite(buffers.controlBuffer, CONTROL_FRAME_COUNTER, frameCounter);

  } finally {
    SharedMemoryManager.releaseLock(buffers.controlBuffer);
  }

  const tDuration = performance.now() - tStart;

  if (!isSharedBuffer) {
    sendResponse({
      type: 'FALLBACK_UPDATE',
      payload: {
        buffer: buffers.bedHeight,
        frame: frameCounter
      }
    });
  }

  sendResponse({
    type: 'TICK_COMPLETE',
    payload: { frame: frameCounter, timeMs: tDuration }
  });
}

/**
 * Self-correcting hybrid 60 Hz simulation loop.
 */
function startSimulationLoop(): void {
  if (loopInterval !== null) clearInterval(loopInterval);

  const targetIntervalMs = 1000.0 / 60.0;

  loopInterval = self.setInterval(() => {
    if (buffers) {
      executeSimulationTick();
    }
  }, targetIntervalMs) as unknown as number;
}
