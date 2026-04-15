import { type GridSquare } from '../store/types';

export const processCityGrowth = (cells: GridSquare[]): GridSquare[] => {
  const newCells = [...cells];
  const GRID_SIZE = 100;

  // Identify expansion targets: empty cells adjacent to populated cells
  const expansionTargets: number[] = [];

  cells.forEach((cell, index) => {
    if (cell.population === 0) {
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE);

      // Check neighbors
      const neighbors = [
        { x: x - 1, y }, { x: x + 1, y },
        { x, y: y - 1 }, { x, y: y + 1 }
      ];

      const isAdjacentToPop = neighbors.some(n => {
        if (n.x >= 0 && n.x < GRID_SIZE && n.y >= 0 && n.y < GRID_SIZE) {
          return cells[n.y * GRID_SIZE + n.x].population > 0;
        }
        return false;
      });

      if (isAdjacentToPop) {
        expansionTargets.push(index);
      }
    } else {
      // Natural growth for existing populated cells
      newCells[index] = {
        ...newCells[index],
        population: Math.round(cell.population * 1.05)
      };
    }
  });

  // Seed new cells with a starting population
  expansionTargets.forEach(index => {
    newCells[index] = {
      ...newCells[index],
      population: 10, // Starting population for sprawl
      allPurposeRatio: 0.5,
      commuterRatio: 0.5
    };
  });

  return newCells;
};
