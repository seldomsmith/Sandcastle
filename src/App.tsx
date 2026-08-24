/**
 * Sandcastle vs. Tide Simulator - Main Application Component
 *
 * Root layout assembling the 3D WebGL SimulationViewport, glassmorphic HUD header,
 * floating tool palette, post-mortem autopsy modal, and state management hooks.
 */

import React, { useState, useEffect } from 'react';
import { SimulationViewport } from './render/SimulationViewport';
import { HUDHeader } from './components/HUDHeader';
import { ToolPalette } from './components/ToolPalette';
import { PostMortemModal } from './components/PostMortemModal';
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
  const [showContours, setShowContours] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [keepHealth, setKeepHealth] = useState(100);
  const [isAutopsyOpen, setIsAutopsyOpen] = useState(false);
  const [survivalTime, setSurvivalTime] = useState(0);

  // Monitor Keep Health during active tide surge
  useEffect(() => {
    if (!isTideActive) return;

    const interval = setInterval(() => {
      const bridge = WorkerBridge.getInstance();
      const buffers = bridge.getBuffers();
      if (buffers) {
        const { bedHeight, waterDepth } = buffers;
        const W = 256;
        const H = 256;
        const centerIdx = (H / 2) * W + (W / 2);
        
        // Evaluate Keep Core elevation & water submergence
        const coreElev = bedHeight[centerIdx];
        const coreWater = waterDepth[centerIdx];

        // Health drops if keep height erodes or becomes submerged
        const health = Math.max(0, Math.min(100, (coreElev / 0.45) * 100 - (coreWater > 0.05 ? 40 : 0)));
        setKeepHealth(health);

        if (health <= 10 && !isAutopsyOpen) {
          setIsAutopsyOpen(true);
          setSurvivalTime(frameCount / 60.0);
          pauseTide();
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isTideActive, frameCount, isAutopsyOpen, pauseTide]);

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

  const handleRestart = () => {
    setIsAutopsyOpen(false);
    setKeepHealth(100);
    resetSimulation();
  };

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Viewport */}
      <SimulationViewport
        activeTool={activeTool}
        brushRadius={brushRadius}
        brushStrength={brushStrength}
        showHeatmap={showHeatmap}
        showContours={showContours}
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
          showContours={showContours}
          speedMultiplier={speedMultiplier}
          keepHealthPercent={keepHealth}
          onChangeSpeed={handleSpeedChange}
          onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
          onToggleContours={() => setShowContours((prev) => !prev)}
          onShare={handleShareCastle}
          onStartTide={startTide}
          onPauseTide={pauseTide}
          onReset={handleRestart}
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

      {/* Post-Mortem Failure Diagnostic Autopsy Modal */}
      <PostMortemModal
        isOpen={isAutopsyOpen}
        survivalTimeSec={survivalTime}
        keepHealthPercent={keepHealth}
        failureCause="Toe Scour & Hydraulic Liquefaction of Castle Base"
        onRestart={handleRestart}
      />
    </main>
  );
};

export default App;
