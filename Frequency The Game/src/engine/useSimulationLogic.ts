import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { generateTrips } from './gravityModel';
import { batchUpdateLoad } from '../store/routeSlice';
import { updateCell, batchUpdateCells } from '../store/gridSlice';
import { setGameOver } from '../store/timeSlice';
import { collectRevenue, resetDailyRevenue, setFleetQuality } from '../store/agencySlice';

export const useSimulationLogic = () => {
  const dispatch = useDispatch();
  const { gameTimestamp, isPlaying, isGameOver, speedMultiplier } = useSelector(
    (state: RootState) => state.time
  );
  const { cells } = useSelector((state: RootState) => state.grid);
  const { routes } = useSelector((state: RootState) => state.route);
  const { farePrice, usedHours, fleetQuality } = useSelector((state: RootState) => state.agency);

  const lastHourRef = useRef<number>(-1);
  const lastDayRef = useRef<number>(-1);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const currentHour = Math.floor(gameTimestamp / 60);
    const currentDay = Math.floor(gameTimestamp / 1440);

    // ── Hourly Logic ─────────────────────────────────────────
    if (currentHour > lastHourRef.current) {
      lastHourRef.current = currentHour;

      // 1. Generate Trips via Gravity Model
      const newTrips = generateTrips(cells, routes);

      // 2. Aggregate load per route (RESET each hour, not accumulate)
      const loadMap: Record<string, number> = {};
      routes.forEach(r => { loadMap[r.id] = 0; }); // reset all to 0 first
      newTrips.forEach(trip => {
        loadMap[trip.routeId] = (loadMap[trip.routeId] || 0) + 1;
      });

      const loadUpdates = Object.entries(loadMap).map(([routeId, load]) => ({
        routeId,
        load,
      }));
      dispatch(batchUpdateLoad(loadUpdates));

      // 3. Collect revenue from completed trips
      if (newTrips.length > 0) {
        dispatch(collectRevenue(newTrips.length));
      }

      // 4. Failure state check (only after Day 1 to give player time)
      if (currentDay >= 1) {
        const totalPop = cells.reduce((acc, c) => acc + c.population, 0);
        const totalRiders = newTrips.length;
        if (totalPop > 0 && totalRiders < totalPop * 0.1 && routes.length > 0) {
          // Don't trigger game over yet — just warn (full failure after Day 30)
          if (currentDay >= 30) {
            dispatch(setGameOver(true));
          }
        }
      }

      // 5. Fleet degradation (-1% quality per 24 active hours)
      // Since evaluating hourly, we divide the hours used by 24 to get the fractional quality loss per hour
      if (usedHours > 0) {
        dispatch(setFleetQuality(fleetQuality - (usedHours / 2400))); // Math.max handled in slice
      }

      // 6. City growth: one new cell becomes populated (adjacency weighted)
      const populatedIndices = new Set<number>();
      cells.forEach((c, i) => { if (c.population > 0) populatedIndices.add(i); });

      const candidates: number[] = [];
      cells.forEach((cell, i) => {
        if (cell.population > 0) return;
        const x = cell.x;
        const y = cell.y;
        const neighbours = [
          (y - 1) * 100 + x, (y + 1) * 100 + x,
          y * 100 + (x - 1), y * 100 + (x + 1),
        ];
        if (neighbours.some(n => populatedIndices.has(n))) candidates.push(i);
      });

      if (candidates.length > 0) {
        const chosenIndex = candidates[Math.floor(Math.random() * candidates.length)];
        const newCell = cells[chosenIndex];
        const centerX = 49.5;
        const centerY = 49.5;
        const dist = Math.sqrt(Math.pow(newCell.x - centerX, 2) + Math.pow(newCell.y - centerY, 2));
        const normalizedDist = Math.min(1, dist / 50);

        const newPop = Math.round(4 + Math.random() * 5 + (1 - normalizedDist) * 3);
        const commuterRatio = Math.max(0.25, Math.min(0.75, 0.5 + (normalizedDist - 0.5) * 0.12 + (Math.random() - 0.5) * 0.08));
        const allPurposeRatio = 1 - commuterRatio;

        dispatch(updateCell({
          index: chosenIndex,
          updates: { population: newPop, allPurposeRatio, commuterRatio },
        }));
      }
    }

    // ── Daily Logic ───────────────────────────────────────────
    if (currentDay > lastDayRef.current) {
      lastDayRef.current = currentDay;

      // 1. Reset daily revenue tracker
      dispatch(resetDailyRevenue());

      // 2. Densify existing populated cells (3% daily growth)
      const growthBatch: { index: number; updates: { population: number } }[] = [];
      cells.forEach((cell, i) => {
        if (cell.population <= 0) return;
        const centerX = 49.5;
        const centerY = 49.5;
        const dist = Math.sqrt(Math.pow(cell.x - centerX, 2) + Math.pow(cell.y - centerY, 2));
        const normalizedDist = Math.min(1, dist / Math.sqrt(2 * Math.pow(49.5, 2)));
        const growthFactor = 0.02 + (1 - normalizedDist) * 0.06 + Math.random() * 0.006;
        const growth = Math.round(cell.population * growthFactor);
        growthBatch.push({
          index: i,
          updates: { population: Math.min(2000, cell.population + growth) },
        });
      });
      if (growthBatch.length > 0) {
        dispatch(batchUpdateCells(growthBatch));
      }
    }
  }, [gameTimestamp, isPlaying, isGameOver, cells, routes, farePrice, speedMultiplier, dispatch]);
};
