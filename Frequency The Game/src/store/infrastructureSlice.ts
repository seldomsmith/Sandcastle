import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface BusStop {
  id: string;
  x: number;
  y: number;
}

export interface InfrastructureState {
  stops: BusStop[];
}

const initialState: InfrastructureState = {
  stops: [],
};

const infrastructureSlice = createSlice({
  name: 'infrastructure',
  initialState,
  reducers: {
    addStop(state, action: PayloadAction<BusStop>) {
      state.stops.push(action.payload);
    },
  },
});

export const { addStop } = infrastructureSlice.actions;
export default infrastructureSlice.reducer;
