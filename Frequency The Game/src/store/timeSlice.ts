import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TimeState {
  isPlaying: boolean;
  speedMultiplier: number;
  gameTimestamp: number; // in game-minutes from start
  hourlyTickCount: number; // to track when to dispatch hourly events
  isGameOver: boolean;
}

const initialState: TimeState = {
  isPlaying: false,
  speedMultiplier: 1,
  gameTimestamp: 0,
  hourlyTickCount: 0,
  isGameOver: false,
};

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    togglePlay(state) {
      state.isPlaying = !state.isPlaying;
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    setSpeed(state, action: PayloadAction<number>) {
      state.speedMultiplier = action.payload;
    },
    updateTimestamp(state, action: PayloadAction<number>) {
      state.gameTimestamp = action.payload;
    },
    hourlyTick(state, action: PayloadAction<number>) {
      // Logic for hourly processing can be triggered by observing this state change
      state.gameTimestamp = action.payload;
    },
    setGameOver(state, action: PayloadAction<boolean>) {
      state.isGameOver = action.payload;
      state.isPlaying = false;
    },
  },
});

export const { togglePlay, setPlaying, setSpeed, updateTimestamp, hourlyTick, setGameOver } = timeSlice.actions;
export default timeSlice.reducer;
