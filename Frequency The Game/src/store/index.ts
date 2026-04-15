import { configureStore } from '@reduxjs/toolkit';
import gridReducer from './gridSlice';
import timeReducer from './timeSlice';
import routeReducer from './routeSlice';
import infrastructureReducer from './infrastructureSlice';
import agencyReducer from './agencySlice';
import toolReducer from './toolSlice';

export const store = configureStore({
  reducer: {
    grid: gridReducer,
    time: timeReducer,
    route: routeReducer,
    infrastructure: infrastructureReducer,
    agency: agencyReducer,
    tool: toolReducer,
  },
  // Disabling serializableCheck for large state if needed, 
  // but let's keep it default for now as we store pure objects.
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
