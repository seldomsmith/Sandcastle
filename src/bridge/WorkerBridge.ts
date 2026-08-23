/**
 * Sandcastle vs. Tide Simulator - Main Thread Worker Bridge
 *
 * Singleton client managing Web Worker instantiation, SharedArrayBuffer ownership,
 * raycast pointer tool interaction dispatching, and zero-copy rendering views.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
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
  SharedSimulationBuffers,
  ScenarioConfig
} from '../types/simulation';
import { SharedMemoryManager } from '../engine/SharedMemory';

export class WorkerBridge {
  private static instance: WorkerBridge | null = null;

  private worker: Worker | null = null;
  private buffers: SharedSimulationBuffers | null = null;
  private isSharedMemory: boolean = false;
  private isInitialized: boolean = false;
  private frameCount: number = 0;
  private lastTickDuration: number = 0;

  private constructor() {}

  /**
   * Access singleton instance.
   */
  public static getInstance(): WorkerBridge {
    if (!WorkerBridge.instance) {
      WorkerBridge.instance = new WorkerBridge();
    }
    return WorkerBridge.instance;
  }

  /**
   * Initializes the Worker process and establishes zero-copy memory buffers.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. Allocate SharedArrayBuffer or ArrayBuffer fallback
    const { buffer, isShared } = SharedMemoryManager.allocateBuffers();
    this.isSharedMemory = isShared;
    this.buffers = SharedMemoryManager.wrapBuffers(buffer);

    // 2. Instantiate Web Worker using ESM worker imports
    this.worker = new Worker(
      new URL('../engine/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 3. Register message listener
    this.worker.onmessage = this.handleWorkerMessage.bind(this);

    // 4. Send INIT command
    return new Promise((resolve) => {
      const onReady = (event: MessageEvent<WorkerMessageResponse>) => {
        if (event.data.type === 'READY') {
          this.isInitialized = true;
          console.info(`[WorkerBridge] Physics engine initialized. Zero-copy SharedArrayBuffer: ${isShared}`);
          resolve();
        }
      };

      if (this.worker) {
        this.worker.addEventListener('message', onReady as EventListener, { once: true });
        
        const initMsg: WorkerMessageRequest = {
          type: SimCommand.INIT,
          payload: { sharedBuffer: buffer as SharedArrayBuffer, isShared }
        };
        
        this.worker.postMessage(initMsg);
      }
    });
  }

  /**
   * Handle incoming worker messages.
   */
  private handleWorkerMessage(event: MessageEvent<WorkerMessageResponse>): void {
    const msg = event.data;

    switch (msg.type) {
      case 'TICK_COMPLETE':
        this.frameCount = msg.payload.frame;
        this.lastTickDuration = msg.payload.timeMs;
        break;

      case 'ERROR':
        console.error('[WorkerBridge] Physics Worker Error:', msg.payload.message);
        break;

      case 'FALLBACK_UPDATE':
        // Fallback for non-SAB environments
        if (this.buffers && !this.isSharedMemory) {
          this.buffers.bedHeight.set(msg.payload.buffer);
        }
        break;
    }
  }

  /**
   * Starts ocean tide and hydrodynamic solver execution.
   */
  public startTide(): void {
    this.postCommand({ type: SimCommand.START_TIDE });
  }

  /**
   * Pauses simulation tick loop.
   */
  public pauseTide(): void {
    this.postCommand({ type: SimCommand.PAUSE_TIDE });
  }

  /**
   * Manually steps single frame.
   */
  public stepSingle(): void {
    this.postCommand({ type: SimCommand.STEP });
  }

  /**
   * Resets simulation grid to default base state.
   */
  public resetSimulation(): void {
    this.postCommand({ type: SimCommand.RESET });
  }

  /**
   * Updates global wave and tide scenario parameters.
   */
  public updateScenario(config: Partial<ScenarioConfig>): void {
    this.postCommand({ type: SimCommand.SET_SCENARIO, payload: config });
  }

  /**
   * Dispatches interactive tool application brush (e.g. Raise, Dig, Compact, Stone).
   * Uses lock-free atomic signals if SharedArrayBuffer is active; falls back to postMessage.
   */
  public applyTool(type: ToolType, gridX: number, gridY: number, radius: number = 5, strength: number = 0.05): void {
    const clampedX = Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(gridX)));
    const clampedY = Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(gridY)));

    if (this.isSharedMemory && this.buffers) {
      const control = this.buffers.controlBuffer;
      SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_TYPE, type);
      SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_X, clampedX);
      SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_Y, clampedY);
      SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_RADIUS, Math.floor(radius));
      SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_STRENGTH, Math.floor(strength * 1000));
      SharedMemoryManager.atomicWrite(control, CONTROL_TOOL_ACTIVE, 1);
    } else {
      this.postCommand({
        type: SimCommand.APPLY_TOOL,
        payload: { type, x: clampedX, y: clampedY, radius, strength }
      });
    }
  }

  /**
   * Internal helper to dispatch commands via postMessage.
   */
  private postCommand(cmd: WorkerMessageRequest): void {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  /**
   * Returns read-only direct views into physics buffers for R3F mesh rendering.
   */
  public getBuffers(): SharedSimulationBuffers | null {
    return this.buffers;
  }

  public getIsSharedMemory(): boolean {
    return this.isSharedMemory;
  }

  public getFrameCount(): number {
    return this.frameCount;
  }

  public getLastTickDuration(): number {
    return this.lastTickDuration;
  }

  /**
   * Terminate worker instance and release resources.
   */
  public destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.buffers = null;
    this.isInitialized = false;
    WorkerBridge.instance = null;
  }
}
