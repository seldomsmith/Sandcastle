import { type GridSquare } from '../store/types';
import { type TransitRoute } from '../store/routeSlice';

export interface Trip {
  originIndex: number;
  destIndex: number;
  routeId: string;
}

const GRID_W = 100;

/**
 * Calculates route catchment: which cells are within walking distance of any route point.
 * Used as a fallback when no explicit bus stops have been placed.
 */
const getRouteCoveredCells = (routes: TransitRoute[]): Set<number> => {
  const covered = new Set<number>();
  const WALK_RADIUS = 2; // squares walkable to nearest route point

  routes.forEach(route => {
    route.points.forEach(p => {
      for (let dy = -WALK_RADIUS; dy <= WALK_RADIUS; dy++) {
        for (let dx = -WALK_RADIUS; dx <= WALK_RADIUS; dx++) {
          const tx = p.x + dx;
          const ty = p.y + dy;
          if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_W) {
            covered.add(ty * GRID_W + tx);
          }
        }
      }
    });
  });

  return covered;
};

/**
 * Is a given cell index reachable by any route point (within walking distance)?
 */
const isNearAnyRoutePoint = (
  cellX: number, cellY: number,
  route: TransitRoute,
  radius = 3
): boolean => {
  return route.points.some(
    p => Math.abs(p.x - cellX) + Math.abs(p.y - cellY) <= radius
  );
};

const vertexKey = (point: { x: number; y: number }) => `${point.x},${point.y}`;

const buildRouteGraph = (routes: TransitRoute[]) => {
  const graph = new Map<string, Set<string>>();

  const addEdge = (from: string, to: string) => {
    if (!graph.has(from)) graph.set(from, new Set());
    if (!graph.has(to)) graph.set(to, new Set());
    graph.get(from)?.add(to);
    graph.get(to)?.add(from);
  };

  routes.forEach(route => {
    for (let i = 1; i < route.points.length; i++) {
      const start = vertexKey(route.points[i - 1]);
      const end = vertexKey(route.points[i]);
      if (start !== end) {
        addEdge(start, end);
      }
    }
  });

  return graph;
};

const getNearbyRouteKeys = (
  cellX: number,
  cellY: number,
  routes: TransitRoute[],
  radius = 3
): Set<string> => {
  const keys = new Set<string>();
  routes.forEach(route => {
    route.points.forEach(point => {
      if (Math.abs(point.x - cellX) + Math.abs(point.y - cellY) <= radius) {
        keys.add(vertexKey(point));
      }
    });
  });
  return keys;
};

const isConnectedOnRouteGraph = (
  originKeys: Set<string>,
  destKeys: Set<string>,
  graph: Map<string, Set<string>>
): boolean => {
  if (originKeys.size === 0 || destKeys.size === 0) return false;

  for (const key of originKeys) {
    if (destKeys.has(key)) return true;
  }

  const visited = new Set<string>();
  const queue: string[] = [...originKeys];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = graph.get(current);
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (destKeys.has(neighbor)) return true;
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return false;
};

/**
 * Generates trips using a simplified gravity model.
 * Fixed bugs:
 * - Removed strict catchmentMultiplier > 0 gate (route proximity used as fallback)
 * - Raised trip multiplier so numbers are actually visible
 * - Trips reset each tick (not accumulated)
 * - Only counts trips where a route physically serves both origin AND a destination
 */
export const generateTrips = (
  cells: GridSquare[],
  routes: TransitRoute[]
): Trip[] => {
  if (routes.length === 0) return [];

  const trips: Trip[] = [];
  const populatedCells = cells.filter(c => c.population > 0);

  // Build coverage map from both explicit stops (catchmentMultiplier) AND route proximity
  const routeProximityCells = getRouteCoveredCells(routes);
  const routeGraph = buildRouteGraph(routes);

  // Weighted destination pool (more population = more likely destination)
  // Build once per tick for performance
  const destinationPool: GridSquare[] = [];
  populatedCells.forEach(cell => {
    const weight = Math.max(1, Math.floor(cell.population / 100));
    for (let i = 0; i < weight; i++) destinationPool.push(cell);
  });

  populatedCells.forEach((cell) => {
    const cellIndex = cell.y * GRID_W + cell.x;

    // A cell can generate trips if it has explicit bus stop catchment OR is near a route
    const hasBusStopCatchment = cell.catchmentMultiplier > 0;
    const hasRouteCatchment = routeProximityCells.has(cellIndex);
    if (!hasBusStopCatchment && !hasRouteCatchment) return;

    // Effective catchment: bus stops give bonus (up to 1.5x)
    const effectiveCatchment = hasBusStopCatchment
      ? Math.min(1.5, 0.8 + cell.catchmentMultiplier * 0.7)
      : 0.4; // route proximity alone = 40% capture

    // Trip volume: each in-game hour, ~8% of population attempts transit
    // This gives ~12 trips for a cell with 150 people at 40% capture
    const tripsToGenerate = Math.round(cell.population * 0.08 * effectiveCatchment);
    if (tripsToGenerate <= 0) return;

    const originKeys = getNearbyRouteKeys(cell.x, cell.y, routes, 3);

    for (let i = 0; i < tripsToGenerate; i++) {
      if (destinationPool.length === 0) break;
      const dest = destinationPool[Math.floor(Math.random() * destinationPool.length)];
      if (dest === cell) continue;

      const destKeys = getNearbyRouteKeys(dest.x, dest.y, routes, 3);
      if (!isConnectedOnRouteGraph(originKeys, destKeys, routeGraph)) continue;

      // Assign the trip to the first route that directly serves the origin cell.
      const servingRoute = routes.find(route => isNearAnyRoutePoint(cell.x, cell.y, route, 3));
      if (servingRoute) {
        trips.push({
          originIndex: cellIndex,
          destIndex: dest.y * GRID_W + dest.x,
          routeId: servingRoute.id,
        });
      }
    }
  });

  return trips;
};
