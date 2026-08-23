/**
 * Sandcastle vs. Tide Simulator - useSimulation Custom Hook
 *
 * Provides reactive state wrappers, simulation lifecycle controls,
 * and dispatch helpers for the main thread UI layer.
 */

import { useEffect, useState, useCallback } from 'react';
import { WorkerBridge } from '../bridge/WorkerBridge';
import { ToolType, ScenarioConfig } from '../types/simulation';

export interface SimulationState {
  isInitialized: boolean;
  isSharedMemory: boolean;
  isTideActive: boolean;
  frameCount: number;
  lastTickMs: number;
  activeTool: ToolType;
  brushRadius: number;
  brushStrength: number;
}

export const useSimulation = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSharedMemory, setIsSharedMemory] = useState(false);
  const [isTideActive, setIsTideActive] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTickMs, setLastTickMs] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.RAISE);
  const [brushRadius, setBrushRadius] = useState<number>(6);
  const [brushStrength, setBrushStrength] = useState<number>(0.04);

  useEffect(() => {
    const bridge = WorkerBridge.getInstance();
    bridge.initialize().then(() => {
      setIsInitialized(true);
      setIsSharedMemory(bridge.getIsSharedMemory());
    });

    const interval = setInterval(() => {
      setFrameCount(bridge.getFrameCount());
      setLastTickMs(bridge.getLastTickDuration());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startTide = useCallback(() => {
    WorkerBridge.getInstance().startTide();
    setIsTideActive(true);
  }, []);

  const pauseTide = useCallback(() => {
    WorkerBridge.getInstance().pauseTide();
    setIsTideActive(false);
  }, []);

  const resetSimulation = useCallback(() => {
    WorkerBridge.getInstance().resetSimulation();
    setIsTideActive(false);
  }, []);

  const updateScenario = useCallback((config: Partial<ScenarioConfig>) => {
    WorkerBridge.getInstance().updateScenario(config);
  }, []);

  return {
    isInitialized,
    isSharedMemory,
    isTideActive,
    frameCount,
    lastTickMs,
    activeTool,
    setActiveTool,
    brushRadius,
    setBrushRadius,
    brushStrength,
    setBrushStrength,
    startTide,
    pauseTide,
    resetSimulation,
    updateScenario
  };
};
