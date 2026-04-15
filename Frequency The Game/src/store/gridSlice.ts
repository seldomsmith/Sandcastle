import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GridSquare, GridState } from './types';

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;

const initialState: GridState = {
  cells: Array.from({ length: GRID_WIDTH * GRID_HEIGHT }, (_, i) => ({
    x: i % GRID_WIDTH,
    y: Math.floor(i / GRID_WIDTH),
    population: 0,
    allPurposeRatio: 0,
    commuterRatio: 0,
    serviceCapacity: 0,
    catchmentMultiplier: 0,
  })),
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  generation: 0,
};

const gridSlice = createSlice({
  name: 'grid',
  initialState,
  reducers: {
    initializeGrid(state, action: PayloadAction<GridSquare[]>) {
      state.cells = action.payload;
    },
    updateCatchment(state, action: PayloadAction<{ index: number; multiplier: number }[]>) {
      action.payload.forEach(({ index, multiplier }) => {
        if (state.cells[index]) {
          state.cells[index].catchmentMultiplier = Math.min(1, state.cells[index].catchmentMultiplier + multiplier);
        }
      });
      state.generation++;
    },
    updateCell(state, action: PayloadAction<{ index: number; updates: Partial<GridSquare> }>) {
      const { index, updates } = action.payload;
      if (state.cells[index]) {
        Object.assign(state.cells[index], updates);
      }
      state.generation++;
    },
    batchUpdateCells(state, action: PayloadAction<{ index: number; updates: Partial<GridSquare> }[]>) {
      action.payload.forEach(({ index, updates }) => {
        if (state.cells[index]) {
          Object.assign(state.cells[index], updates);
        }
      });
      state.generation++;
    },
  },
});

export const { initializeGrid, updateCatchment, updateCell, batchUpdateCells } = gridSlice.actions;
export default gridSlice.reducer;
