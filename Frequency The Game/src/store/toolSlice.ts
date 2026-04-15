import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToolMode = 'select' | 'drawRoute' | 'placeStop' | 'editRoute';

interface ToolState {
  mode: ToolMode;
  editingRouteId: string | null;
}

const initialState: ToolState = {
  mode: 'select',
  editingRouteId: null,
};

const toolSlice = createSlice({
  name: 'tool',
  initialState,
  reducers: {
    setToolMode(state, action: PayloadAction<ToolMode>) {
      state.mode = action.payload;
      if (action.payload !== 'editRoute') {
        state.editingRouteId = null;
      }
    },
    setEditingRoute(state, action: PayloadAction<string | null>) {
      state.editingRouteId = action.payload;
      state.mode = action.payload ? 'editRoute' : 'select';
    },
  },
});

export const { setToolMode, setEditingRoute } = toolSlice.actions;
export default toolSlice.reducer;
