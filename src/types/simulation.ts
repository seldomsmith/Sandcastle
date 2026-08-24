/**
 * Sandcastle vs. Tide Simulator - Type Definitions
 *
 * Defines message protocols, command enumerations, tool specifications,
 * and scenario configurations for main-thread and worker communication.
 */

export enum SimCommand {
  INIT = 'INIT',
  START_TIDE = 'START_TIDE',
  PAUSE_TIDE = 'PAUSE_TIDE',
  STEP = 'STEP',
  APPLY_TOOL = 'APPLY_TOOL',
  SET_SCENARIO = 'SET_SCENARIO',
  RESET = 'RESET'
}

export enum ToolType {
  NONE = 0,
  RAISE = 1,
  DIG = 2,
  COMPACT = 3,
  STONE = 4,
  WALL_90 = 5,
  BUCKET = 6,
  CULVERT = 7,
  SHELLS = 8
}

export enum MaterialType {
  SAND = 0,
  STONE = 1,
  SHELL = 2,
  WALL_90 = 3
}

export interface ScenarioConfig {
  waveAmplitude: number;      // Peak wave height (m)
  wavePeriod: number;         // Wave period (s)
  tideRiseRate: number;       // Sea level increase rate (m/s)
  baseSeaLevel: number;       // Starting tide level (m)
  windVelocityX: number;      // Wind force component X
  windVelocityY: number;      // Wind force component Y
  sedimentCohesion: number;   // Global sand cohesion factor
}

export interface ToolApplyPayload {
  type: ToolType;
  x: number;            // Cell grid index X [0..255]
  y: number;            // Cell grid index Y [0..255]
  radius: number;       // Radius in cell units
  strength: number;     // Applied strength/delta per frame
  flattenAngle?: number; // Rolling pin flatten angle (0 = flat table, 45 = ramp)
}

export type WorkerMessageRequest =
  | { type: SimCommand.INIT; payload: { sharedBuffer: SharedArrayBuffer; isShared: boolean } }
  | { type: SimCommand.START_TIDE }
  | { type: SimCommand.PAUSE_TIDE }
  | { type: SimCommand.STEP }
  | { type: SimCommand.APPLY_TOOL; payload: ToolApplyPayload }
  | { type: SimCommand.SET_SCENARIO; payload: Partial<ScenarioConfig> }
  | { type: SimCommand.RESET };

export type WorkerMessageResponse =
  | { type: 'READY'; payload: { isShared: boolean } }
  | { type: 'TICK_COMPLETE'; payload: { frame: number; timeMs: number } }
  | { type: 'FALLBACK_UPDATE'; payload: { buffer: Float32Array; frame: number } };

export interface SharedSimulationBuffers {
  bedHeight: Float32Array;
  waterDepth: Float32Array;
  momentumX: Float32Array;
  momentumY: Float32Array;
  compaction: Float32Array;
  saturation: Float32Array;
  materialFlags: Float32Array;
  controlBuffer: Int32Array;
}
