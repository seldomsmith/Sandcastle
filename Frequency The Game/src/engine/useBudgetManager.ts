import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { updateUsage } from '../store/agencySlice';
import { setPlaying } from '../store/timeSlice';

export const useBudgetManager = () => {
  const dispatch = useDispatch();
  const routes = useSelector((state: RootState) => state.route.routes);
  const budgetHours = useSelector((state: RootState) => state.agency.budgetHours);

  useEffect(() => {
    let totalDailyHours = 0;

    routes.forEach((route) => {
      const routeSegments = Math.max(0, route.points.length - 1);
      const routeDurationMinutes = routeSegments * 6 * 2 + route.points.length * 1;
      const dailyFrequencySum = route.weeklyFrequency.slice(0, 24).reduce((acc, f) => acc + f, 0);
      const dailyRouteHours = (routeDurationMinutes / 60) * dailyFrequencySum;
      totalDailyHours += dailyRouteHours;
    });

    dispatch(updateUsage(Math.round(totalDailyHours)));

    if (totalDailyHours > budgetHours) {
      dispatch(setPlaying(false));
      // In a real app we'd trigger an alert here, but for now we just pause if the schedule exceeds the available-service-hours pool.
    }
  }, [routes, budgetHours, dispatch]);
};
