/**
 * Sandcastle vs. Tide Simulator - Main Application Component
 *
 * Root layout assembling the 3D WebGL SimulationViewport, glassmorphic HUD header,
 * floating tool palette, and state management hooks.
 */

import React, { useState } from 'react';
import { SimulationViewport } from './render/SimulationViewport';
import { HUDHeader } from './components/HUDHeader';
import { ToolPalette } from './components/ToolPalette';
import { useSimulation } from './hooks/useSimulation';
import { WorkerBridge } from './bridge/WorkerBridge';
import { BlueprintEncoder } from './utils/BlueprintEncoder';
import { ToolType } from './types/simulation';

export const App: React.FC = () => {
  const {
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
    resetSimulation
  } = useSimulation();

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const handleShareCastle = () => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();
    if (buffers) {
      const payload = BlueprintEncoder.encode(buffers);
      navigator.clipboard.writeText(window.location.origin + '#build=' + payload);
      alert('Castle blueprint payload copied to clipboard!');
    }
  };

  const handleSpeedChange = (speed: number) => {
    setSpeedMultiplier(speed);
    WorkerBridge.getInstance().updateScenario({ wavePeriod: 5.0 / speed });
  };

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Viewport */}
      <SimulationViewport
        activeTool={activeTool}
        brushRadius={brushRadius}
        brushStrength={brushStrength}
        showHeatmap={showHeatmap}
        isOrbitLocked={activeTool !== ToolType.NONE}
      />

      {/* Top Glassmorphic Telemetry HUD */}
      {isInitialized && (
        <HUDHeader
          isTideActive={isTideActive}
          frameCount={frameCount}
          lastTickMs={lastTickMs}
          isSharedMemory={isSharedMemory}
          showHeatmap={showHeatmap}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={handleSpeedChange}
          onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
          onShare={handleShareCastle}
          onStartTide={startTide}
          onPauseTide={pauseTide}
          onReset={resetSimulation}
        />
      )}

      {/* Left-Side Sculpting Tool Palette */}
      {isInitialized && (
        <ToolPalette
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          brushRadius={brushRadius}
          onChangeRadius={setBrushRadius}
          brushStrength={brushStrength}
          onChangeStrength={setBrushStrength}
        />
      )}
    </main>
  );
};

export default App;
