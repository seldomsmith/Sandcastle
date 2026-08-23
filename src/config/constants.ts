/**
 * Sandcastle vs. Tide Simulator - Physical & Numerical Constants
 *
 * Defines grid dimensions, fixed physics timestep, geotechnical limits,
 * hydrodynamic coefficients, and SharedArrayBuffer memory layout offsets.
 */

// Grid & Domain Dimensions
export const GRID_WIDTH = 256;
export const GRID_HEIGHT = 256;
export const CELL_COUNT = GRID_WIDTH * GRID_HEIGHT; // 65,536 cells
export const CELL_SIZE = 0.025; // 0.025 metres per cell cell size (6.4m x 6.4m domain)
export const DOMAIN_SIZE_X = GRID_WIDTH * CELL_SIZE; // 6.4 metres
export const DOMAIN_SIZE_Y = GRID_HEIGHT * CELL_SIZE; // 6.4 metres

// Physics Simulation Constants
export const DT = 1.0 / 60.0; // Fixed timestep (60 Hz simulation loop)
export const GRAVITY = 9.81; // Acceleration due to gravity (m/s^2)
export const BEDROCK_ELEVATION = 0.0; // Minimum elevation boundary (m)
export const MAX_BUILD_HEIGHT = 1.2; // Maximum sand height achievable by player (m)
export const MIN_WATER_DEPTH = 1e-4; // Wetting/drying threshold depth (m) to avoid division by zero
export const PIPE_CROSS_SECTION = 0.000625; // Virtual pipe area (CELL_SIZE^2) (m^2)
export const VIRTUAL_PIPE_LENGTH = CELL_SIZE; // Virtual pipe length (m)

// Geotechnical & Sediment Dynamics Constants
export const DRY_ANGLE_OF_REPOSE = 0.5934; // ~34 degrees in radians for dry sand
export const WET_ANGLE_OF_REPOSE = 0.7854; // ~45 degrees in radians for compacted/wet sand
export const SATURATED_ANGLE_OF_REPOSE = 0.2618; // ~15 degrees in radians for liquefied sand
export const CRITICAL_SHEAR_DETACHMENT = 0.015; // Shear threshold for water erosion (m/s equivalent stress)
export const SEDIMENT_CAPACITY_COEFF = 0.008; // Sediment transport capacity multiplier
export const SEDIMENT_DEPOSITION_RATE = 0.15; // Rate at which suspended sediment settles to bed
export const DISSOLUTION_RATE = 0.08; // Saturation rate of sand when submerged

// SharedArrayBuffer Layout Offset Indices (in Float32Array element units)
// Total fields per cell = 7 Float32 arrays + 1 Int32 control array
export const FIELD_BED_HEIGHT = 0;       // Terrain bed elevation z_b (m)
export const FIELD_WATER_DEPTH = 1;      // Water column depth h (m)
export const FIELD_MOMENTUM_X = 2;       // Water momentum component u * h (m^2/s)
export const FIELD_MOMENTUM_Y = 3;       // Water momentum component v * h (m^2/s)
export const FIELD_COMPACTION = 4;       // Sand compaction coefficient [0.0 = loose, 1.0 = rock-hard]
export const FIELD_SATURATION = 5;       // Water saturation level of sand [0.0 = dry, 1.0 = saturated]
export const FIELD_MATERIAL_FLAGS = 6;   // Bitfield/float for material types (0: Sand, 1: Stone/Rock, 2: Shells)

export const NUM_FLOAT_FIELDS = 7;
export const FLOAT_BUFFER_SIZE = CELL_COUNT * NUM_FLOAT_FIELDS * Float32Array.BYTES_PER_ELEMENT;

// Control / Synchronization Buffer Offset Indices (Int32Array units)
export const CONTROL_MUTEX_LOCK = 0;     // Atomic lock for double-buffered atomic swaps (0 = free, 1 = locked)
export const CONTROL_FRAME_COUNTER = 1;  // Monotonic simulation step index counter
export const CONTROL_STATE_FLAGS = 2;   // Simulation state bitfield (1 = running, 0 = paused, 2 = tide active)
export const CONTROL_TOOL_ACTIVE = 3;   // Active tool trigger signal
export const CONTROL_TOOL_TYPE = 4;     // Enum ID of active tool
export const CONTROL_TOOL_X = 5;        // Grid coordinate X of tool application
export const CONTROL_TOOL_Y = 6;        // Grid coordinate Y of tool application
export const CONTROL_TOOL_RADIUS = 7;   // Tool application radius in cells
export const CONTROL_TOOL_STRENGTH = 8; // Tool application magnitude strength

export const NUM_CONTROL_FIELDS = 16;
export const CONTROL_BUFFER_SIZE = NUM_CONTROL_FIELDS * Int32Array.BYTES_PER_ELEMENT;
