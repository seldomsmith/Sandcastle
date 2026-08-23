/**
 * Sandcastle vs. Tide Simulator - Shared Memory Allocator & Sync
 *
 * Allocates structured layout over SharedArrayBuffer (or ArrayBuffer fallback)
 * and provides thread-safe typed views and atomic lock primitives.
 */

import {
  CELL_COUNT,
  FLOAT_BUFFER_SIZE,
  CONTROL_BUFFER_SIZE,
  FIELD_BED_HEIGHT,
  FIELD_WATER_DEPTH,
  FIELD_MOMENTUM_X,
  FIELD_MOMENTUM_Y,
  FIELD_COMPACTION,
  FIELD_SATURATION,
  FIELD_MATERIAL_FLAGS,
  CONTROL_MUTEX_LOCK
} from '../config/constants';
import { SharedSimulationBuffers } from '../types/simulation';

export class SharedMemoryManager {
  /**
   * Allocates a unified SharedArrayBuffer containing float state matrices and control integers.
   * If SharedArrayBuffer is unavailable (due to non-crossOriginIsolated environment),
   * falls back to standard ArrayBuffer.
   */
  public static allocateBuffers(): { buffer: SharedArrayBuffer | ArrayBuffer; isShared: boolean } {
    const totalBytes = FLOAT_BUFFER_SIZE + CONTROL_BUFFER_SIZE;
    const isSharedSupported = typeof SharedArrayBuffer !== 'undefined';

    if (isSharedSupported) {
      try {
        const buffer = new SharedArrayBuffer(totalBytes);
        return { buffer, isShared: true };
      } catch (err) {
        console.warn('[SharedMemoryManager] SharedArrayBuffer allocation failed. Falling back to ArrayBuffer:', err);
      }
    }

    const buffer = new ArrayBuffer(totalBytes);
    return { buffer, isShared: false };
  }

  /**
   * Wraps an existing SharedArrayBuffer / ArrayBuffer into typed sub-views for simulation fields.
   */
  public static wrapBuffers(buffer: SharedArrayBuffer | ArrayBuffer): SharedSimulationBuffers {
    const floatByteOffset = 0;
    const controlByteOffset = FLOAT_BUFFER_SIZE;

    const fullFloatView = new Float32Array(buffer, floatByteOffset, CELL_COUNT * 7);
    const controlBuffer = new Int32Array(buffer, controlByteOffset, 16);

    // Sub-slice individual field views without copy
    const bedHeight = fullFloatView.subarray(FIELD_BED_HEIGHT * CELL_COUNT, (FIELD_BED_HEIGHT + 1) * CELL_COUNT);
    const waterDepth = fullFloatView.subarray(FIELD_WATER_DEPTH * CELL_COUNT, (FIELD_WATER_DEPTH + 1) * CELL_COUNT);
    const momentumX = fullFloatView.subarray(FIELD_MOMENTUM_X * CELL_COUNT, (FIELD_MOMENTUM_X + 1) * CELL_COUNT);
    const momentumY = fullFloatView.subarray(FIELD_MOMENTUM_Y * CELL_COUNT, (FIELD_MOMENTUM_Y + 1) * CELL_COUNT);
    const compaction = fullFloatView.subarray(FIELD_COMPACTION * CELL_COUNT, (FIELD_COMPACTION + 1) * CELL_COUNT);
    const saturation = fullFloatView.subarray(FIELD_SATURATION * CELL_COUNT, (FIELD_SATURATION + 1) * CELL_COUNT);
    const materialFlags = fullFloatView.subarray(FIELD_MATERIAL_FLAGS * CELL_COUNT, (FIELD_MATERIAL_FLAGS + 1) * CELL_COUNT);

    return {
      sharedArrayBuffer: buffer as SharedArrayBuffer,
      bedHeight,
      waterDepth,
      momentumX,
      momentumY,
      compaction,
      saturation,
      materialFlags,
      controlBuffer
    };
  }

  /**
   * Atomic spin-lock acquisition helper.
   */
  public static acquireLock(controlBuffer: Int32Array): boolean {
    if (typeof Atomics !== 'undefined' && controlBuffer.buffer instanceof SharedArrayBuffer) {
      // Try acquiring lock (swap 0 -> 1)
      return Atomics.compareExchange(controlBuffer, CONTROL_MUTEX_LOCK, 0, 1) === 0;
    }
    return true; // Fallback assumes single-thread synchronous access lock
  }

  /**
   * Atomic spin-lock release helper.
   */
  public static releaseLock(controlBuffer: Int32Array): void {
    if (typeof Atomics !== 'undefined' && controlBuffer.buffer instanceof SharedArrayBuffer) {
      Atomics.store(controlBuffer, CONTROL_MUTEX_LOCK, 0);
      Atomics.notify(controlBuffer, CONTROL_MUTEX_LOCK, 1);
    }
  }

  /**
   * Read integer value atomically.
   */
  public static atomicRead(controlBuffer: Int32Array, index: number): number {
    if (typeof Atomics !== 'undefined' && controlBuffer.buffer instanceof SharedArrayBuffer) {
      return Atomics.load(controlBuffer, index);
    }
    return controlBuffer[index];
  }

  /**
   * Write integer value atomically.
   */
  public static atomicWrite(controlBuffer: Int32Array, index: number, value: number): void {
    if (typeof Atomics !== 'undefined' && controlBuffer.buffer instanceof SharedArrayBuffer) {
      Atomics.store(controlBuffer, index, value);
    } else {
      controlBuffer[index] = value;
    }
  }
}
