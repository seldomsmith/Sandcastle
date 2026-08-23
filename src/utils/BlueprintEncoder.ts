/**
 * Sandcastle vs. Tide Simulator - Blueprint Encoder & Steganography
 *
 * Implements Run-Length Encoding (RLE) compression for terrain heightfields
 * and material matrices, supporting Base64 URL sharing and PNG steganography.
 */

import { GRID_WIDTH, GRID_HEIGHT, CELL_COUNT } from '../config/constants';
import { SharedSimulationBuffers } from '../types/simulation';

export class BlueprintEncoder {
  /**
   * Encodes current bed height and material flags into a compact Base64 payload.
   */
  public static encode(buffers: SharedSimulationBuffers): string {
    const { bedHeight, materialFlags } = buffers;
    const rawData: number[] = [];

    // Quantize Float32 height (0.0 to 1.2m) into 8-bit integers [0..255]
    for (let i = 0; i < CELL_COUNT; i++) {
      const qHeight = Math.min(255, Math.max(0, Math.floor((bedHeight[i] / 1.2) * 255)));
      const mat = Math.floor(materialFlags[i]);
      rawData.push(qHeight, mat);
    }

    // Run-Length Encoding (RLE)
    const rleData: number[] = [];
    let i = 0;
    while (i < rawData.length) {
      const h = rawData[i];
      const m = rawData[i + 1];
      let count = 1;

      while (
        i + count * 2 < rawData.length &&
        rawData[i + count * 2] === h &&
        rawData[i + count * 2 + 1] === m &&
        count < 255
      ) {
        count++;
      }

      rleData.push(h, m, count);
      i += count * 2;
    }

    // Convert byte array to Base64 string
    const uint8Array = new Uint8Array(rleData);
    let binary = '';
    for (let j = 0; j < uint8Array.length; j++) {
      binary += String.fromCharCode(uint8Array[j]);
    }
    return btoa(binary);
  }

  /**
   * Decodes Base64 payload back into shared memory buffers.
   */
  public static decode(payload: string, buffers: SharedSimulationBuffers): void {
    const { bedHeight, materialFlags } = buffers;
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    let cellIndex = 0;
    let byteIndex = 0;

    while (byteIndex < bytes.length && cellIndex < CELL_COUNT) {
      const h = bytes[byteIndex];
      const m = bytes[byteIndex + 1];
      const count = bytes[byteIndex + 2];

      const decodedHeight = (h / 255.0) * 1.2;

      for (let c = 0; c < count && cellIndex < CELL_COUNT; c++) {
        bedHeight[cellIndex] = decodedHeight;
        materialFlags[cellIndex] = m;
        cellIndex++;
      }

      byteIndex += 3;
    }
  }
}
