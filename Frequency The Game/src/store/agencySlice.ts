import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AgencyState {
  treasury: number;
  budgetHours: number;
  usedHours: number;
  fleetSize: number;
  farePrice: number;        // $ per trip
  fleetQuality: number;     // 0-100%
  totalRidership: number;   // rolling 24h completed trips
  dailyRevenue: number;
}

const initialState: AgencyState = {
  treasury: 1000,     // Start with some seed capital
  budgetHours: 48,    // 48h starting budget as per vision 2.1.2
  usedHours: 0,
  fleetSize: 10,
  farePrice: 3.00,
  fleetQuality: 100,
  totalRidership: 0,
  dailyRevenue: 0,
};

const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    updateUsage(state, action: PayloadAction<number>) {
      state.usedHours = action.payload;
    },
    setBudget(state, action: PayloadAction<number>) {
      state.budgetHours = action.payload;
    },
    setFare(state, action: PayloadAction<number>) {
      state.farePrice = action.payload;
    },
    collectRevenue(state, action: PayloadAction<number>) {
      // action.payload = number of completed trips this tick
      const earned = action.payload * state.farePrice;
      state.treasury += earned;
      state.dailyRevenue += earned;
      state.totalRidership += action.payload;
    },
    resetDailyRevenue(state) {
      state.dailyRevenue = 0;
    },
    setFleetQuality(state, action: PayloadAction<number>) {
      state.fleetQuality = Math.max(0, Math.min(100, action.payload));
    },
    repairFleet(state, action: PayloadAction<number>) {
      // payload = target quality %, deducts from treasury
      const qualityGain = action.payload - state.fleetQuality;
      const cost = qualityGain * 150;
      if (state.treasury >= cost) {
        state.treasury -= cost;
        state.fleetQuality = action.payload;
      }
    },
    buyServiceHours(state, action: PayloadAction<number>) {
      // payload = number of hours to buy ($500 per hour)
      const cost = action.payload * 500;
      if (state.treasury >= cost) {
        state.treasury -= cost;
        state.budgetHours += action.payload;
      }
    },
  },
});

export const {
  updateUsage, setBudget, setFare, collectRevenue,
  resetDailyRevenue, setFleetQuality, repairFleet, buyServiceHours
} = agencySlice.actions;
export default agencySlice.reducer;
