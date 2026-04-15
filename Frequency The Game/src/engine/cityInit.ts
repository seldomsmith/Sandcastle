import { type GridSquare } from '../store/types';

const GRID_SIZE = 100;
const CORE_SIZE = 10;
const TOTAL_STARTING_POPULATION = 10000;

export const initializeCityCore = (currentCells: GridSquare[]): GridSquare[] => {
  const newCells = [...currentCells];
  const centerX = GRID_SIZE / 2;
  const centerY = GRID_SIZE / 2;
  const halfCore = CORE_SIZE / 2;

  // Identify core squares and calculate weights
  const coreIndices: number[] = [];
  const weights: number[] = [];
  let totalWeight = 0;

  for (let y = centerY - halfCore; y < centerY + halfCore; y++) {
    for (let x = centerX - halfCore; x < centerX + halfCore; x++) {
      const index = y * GRID_SIZE + x;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      // Weight decreases with distance (using a simple inverse or squared inverse)
      // We'll use (MaxDist - dist)^2 to emphasize the center
      const maxDist = Math.sqrt(Math.pow(halfCore, 2) * 2);
      const weight = Math.pow(Math.max(0, maxDist - dist), 2);
      
      coreIndices.push(index);
      weights.push(weight);
      totalWeight += weight;
    }
  }

  // Distribute population based on weights
  coreIndices.forEach((index, i) => {
    const squareWeight = weights[i];
    const population = Math.round((squareWeight / totalWeight) * TOTAL_STARTING_POPULATION);
    
    // Ratios based on distance (0 to 1)
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const normalizedDist = dist / (Math.sqrt(Math.pow(halfCore, 2) * 2));

    // Innermost (low normalizedDist) -> high all-purpose
    // Peripheral (high normalizedDist) -> high commuter
    const allPurposeRatio = 1 - normalizedDist;
    const commuterRatio = normalizedDist;

    newCells[index] = {
      ...newCells[index],
      population,
      allPurposeRatio,
      commuterRatio,
    };
  });

  return newCells;
};
