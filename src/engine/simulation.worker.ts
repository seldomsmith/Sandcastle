/**
 * Sandcastle vs. Tide Simulator - Web Worker Simulation Engine
 *
 * Dedicated worker thread execution context running the Extended Piped-Flow hydrodynamics,
 * geotechnical detachment, tool brush applications, and atomic sync loop.
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

// Worker Context State Variables
let buffers: SharedSimulationBuffers | null = null;
let isSharedBuffer: boolean = false;
let isRunning: boolean = false;
let frameCounter: number = 0;
let loopInterval: number | null = null;

const pipedFlowSolver = new PipedFlowSolver();
const geotechnicalEngine = new GeotechnicalEngine();

// Slow, Realistic Coastal Scenario Default Parameters
const scenario: ScenarioConfig = {
  waveAmplitude: 0.10,
  wavePeriod: 12.0,       // Slow 12-second wave period
  tideRiseRate: 0.00008,  // 10x slower sea-level rise rate
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
      Object.assign(scenario, message.payload);
      break;
    }

    case SimCommand.RESET: {
      if (buffers) {
        initializeTerrain(buffers);
        frameCounter = 0;
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
 * Initialize base sand mound and flat bedrock terrain.
 */
function initializeTerrain(buf: SharedSimulationBuffers): void {
  const { bedHeight, waterDepth, momentumX, momentumY, compaction, saturation, materialFlags } = buf;

  const W = GRID_WIDTH;
  const H = GRID_HEIGHT;
  const centerX = W / 2;
  const centerY = H / 2;
  const radius = W * 0.25;

  for (let y = 0; y < H; y++) {
    const rowOffset = y * W;
    for (let x = 0; x < W; x++) {
      const idx = rowOffset + x;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base plateau sandcastle mound
      if (dist < radius) {
        const heightFactor = Math.cos((dist / radius) * (Math.PI / 2));
        bedHeight[idx] = BEDROCK_ELEVATION + heightFactor * 0.45;
        compaction[idx] = 0.6;
      } else {
        bedHeight[idx] = BEDROCK_ELEVATION + 0.05;
        compaction[idx] = 0.2;
      }

      waterDepth[idx] = y < H * 0.15 ? (0.15 - (y / (H * 0.15)) * 0.15) : 0.0;
      momentumX[idx] = 0.0;
      momentumY[idx] = 0.0;
      saturation[idx] = waterDepth[idx] > 0 ? 0.8 : 0.1;
      materialFlags[idx] = 0.0; // Sand
    }
  }
}

/**
 * Applies interactive raycast tool brushes to the grid.
 */
function applyToolBrush(buf: SharedSimulationBuffers, tool: { type: ToolType; x: number; y: number; radius: number; strength: number }): void {
  const { bedHeight, compaction, materialFlags } = buf;
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
          break;

        case ToolType.DIG:
          bedHeight[idx] = Math.max(BEDROCK_ELEVATION, bedHeight[idx] - delta);
          break;

        case ToolType.COMPACT:
          compaction[idx] = Math.min(1.0, compaction[idx] + delta * 2.0);
          break;

        case ToolType.STONE:
          materialFlags[idx] = 1.0; // Mark as rigid non-erodible stone
          compaction[idx] = 1.0;
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
 * Primary 60 Hz physics tick execution step.
 */
function executeSimulationTick(): void {
  if (!buffers) return;

  const tStart = performance.now();

  // 1. Process main thread atomic tool signals
  processControlSignals(buffers);

  // 2. Lock buffer for execution if shared
  const lockAcquired = SharedMemoryManager.acquireLock(buffers.controlBuffer);
  if (!lockAcquired) return;

  try {
    // 3. Step Piped-Flow Hydrodynamics Engine if tide active
    if (isRunning) {
      pipedFlowSolver.step(buffers, scenario, frameCounter);
    }

    // 4. Step Geotechnical Detachment & Slumping Engine
    geotechnicalEngine.step(buffers);

    frameCounter++;
    SharedMemoryManager.atomicWrite(buffers.controlBuffer, CONTROL_FRAME_COUNTER, frameCounter);

  } finally {
    SharedMemoryManager.releaseLock(buffers.controlBuffer);
  }

  const tDuration = performance.now() - tStart;

  // If using non-SharedArrayBuffer fallback, post array buffer updates back to main thread
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
