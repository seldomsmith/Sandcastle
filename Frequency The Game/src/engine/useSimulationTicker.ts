import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { updateTimestamp, hourlyTick } from '../store/timeSlice';

const REAL_TO_GAME_RATIO = 8; // 1 real second = 8 game minutes (1440/180)

export const useSimulationTicker = () => {
  const dispatch = useDispatch();
  const { isPlaying, speedMultiplier, gameTimestamp } = useSelector((state: RootState) => state.time);
  
  const lastTimeRef = useRef<number>(0);
  const accumGameMinutesRef = useRef<number>(gameTimestamp);
  const lastHourDispatchedRef = useRef<number>(Math.floor(gameTimestamp / 60));

  useEffect(() => {
    let requestRef: number;

    const tick = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const deltaMs = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying) {
        const deltaSeconds = deltaMs / 1000;
        const totalGameMinutesGained = deltaSeconds * REAL_TO_GAME_RATIO * speedMultiplier;
        
        accumGameMinutesRef.current += totalGameMinutesGained;
        
        const currentTotalMinutes = Math.floor(accumGameMinutesRef.current);
        const currentHour = Math.floor(currentTotalMinutes / 60);

        // Update basic timestamp per frame for smooth UI (if needed, or batch it)
        dispatch(updateTimestamp(currentTotalMinutes));

        // Dispatch hourly tick if a new hour has passed
        if (currentHour > lastHourDispatchedRef.current) {
          lastHourDispatchedRef.current = currentHour;
          dispatch(hourlyTick(currentTotalMinutes));
        }
      }

      requestRef = requestAnimationFrame(tick);
    };

    requestRef = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef);
  }, [isPlaying, speedMultiplier, dispatch]);
};
