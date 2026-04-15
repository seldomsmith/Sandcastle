import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface RoutePoint {
  x: number;
  y: number;
}

export interface TransitRoute {
  id: string;
  name: string;
  points: RoutePoint[];
  color: string;
  weeklyFrequency: number[]; // 24 hours
  serviceLoad: number;
  visible: boolean;
}

export interface RouteState {
  routes: TransitRoute[];
}

const initialState: RouteState = {
  routes: [],
};

// Default color palette (excludes red/blue per vision doc)
export const ROUTE_COLORS = ['#37A300', '#D6C200', '#D26E00', '#C1009A', '#0098AA', '#E15AAE', '#80C800'];

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    addRoute(state, action: PayloadAction<TransitRoute>) {
      state.routes.push({ ...action.payload, visible: action.payload.visible ?? true });
    },
    removeRoute(state, action: PayloadAction<string>) {
      state.routes = state.routes.filter(r => r.id !== action.payload);
    },
    batchUpdateLoad(state, action: PayloadAction<{ routeId: string; load: number }[]>) {
      action.payload.forEach(({ routeId, load }) => {
        const route = state.routes.find(r => r.id === routeId);
        if (route) {
          route.serviceLoad = load;
        }
      });
    },
    updateRouteFrequency(state, action: PayloadAction<{ routeId: string; frequencies: number[] }>) {
      const route = state.routes.find(r => r.id === action.payload.routeId);
      if (route) {
        route.weeklyFrequency = action.payload.frequencies;
      }
    },
    updateRouteColor(state, action: PayloadAction<{ routeId: string; color: string }>) {
      const route = state.routes.find(r => r.id === action.payload.routeId);
      if (route) {
        route.color = action.payload.color;
      }
    },
    renameRoute(state, action: PayloadAction<{ routeId: string; name: string }>) {
      const route = state.routes.find(r => r.id === action.payload.routeId);
      if (route) {
        route.name = action.payload.name;
      }
    },
    updateRoutePoints(state, action: PayloadAction<{ routeId: string; points: RoutePoint[] }>) {
      const route = state.routes.find(r => r.id === action.payload.routeId);
      if (route) {
        route.points = action.payload.points;
      }
    },
    toggleRouteVisibility(state, action: PayloadAction<string>) {
      const route = state.routes.find(r => r.id === action.payload);
      if (route) {
        route.visible = !route.visible;
      }
    },
  },
});

export const { addRoute, removeRoute, batchUpdateLoad, updateRouteFrequency, updateRouteColor, renameRoute, updateRoutePoints, toggleRouteVisibility } = routeSlice.actions;
export default routeSlice.reducer;
