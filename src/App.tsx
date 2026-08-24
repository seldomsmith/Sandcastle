/**
 * Sandcastle vs. Tide Simulator - Main Application Component
 *
 * Root layout assembling the 3D WebGL SimulationViewport, Warm Technical Neo-Brutalist HUD header,
 * IntegrityScorecardModal, floating tool palette, post-mortem autopsy modal, and state management hooks.
 */

import React, { useState, useEffect } from 'react';
import { SimulationViewport } from './render/SimulationViewport';
import { HUDHeader } from './components/HUDHeader';
import { ToolPalette } from './components/ToolPalette';
import { PostMortemModal } from './components/PostMortemModal';
import { IntegrityScorecardModal, TelemetryPoint } from './components/IntegrityScorecardModal';
import { useSimulation } from './hooks/useSimulation';
import { WorkerBridge } from './bridge/WorkerBridge';
import { BlueprintEncoder } from './utils/BlueprintEncoder';
import { ToolType } from './types/simulation';
import { LightingPreset, LIGHTING_PRESETS } from './config/lightingPresets';
import { BeachDomainPreset } from './config/constants';

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
  const [initialKeepElev, setInitialKeepElev] = useState<number | null>(null);
  const [isAutopsyOpen, setIsAutopsyOpen] = useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [activeLighting, setActiveLighting] = useState<LightingPreset>(LIGHTING_PRESETS[0]);
  const [activeBeachPreset, setActiveBeachPreset] = useState<BeachDomainPreset>(BeachDomainPreset.STANDARD_256);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Measure initial Keep Core elevation when simulation initializes
  useEffect(() => {
    if (!isInitialized) return;
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();
    if (buffers) {
      const { bedHeight } = buffers;
      const W = 256;
      const H = 256;
      let totalElev = 0;
      let count = 0;

      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const idx = (H / 2 + dy) * W + (W / 2 + dx);
          totalElev += bedHeight[idx];
          count++;
        }
      }
      setInitialKeepElev(totalElev / count);
    }
  }, [isInitialized]);

  // Continuously evaluate Keep Integrity & collect telemetry points during simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const bridge = WorkerBridge.getInstance();
      const buffers = bridge.getBuffers();
      if (buffers) {
        const { bedHeight, waterDepth, momentumY, saturation } = buffers;
        const W = 256;
        const H = 256;

        let totalElev = 0;
        let totalWater = 0;
        let totalWaveMomentum = 0;
        let totalSat = 0;
        let count = 0;

        for (let dy = -8; dy <= 8; dy++) {
          for (let dx = -8; dx <= 8; dx++) {
            const idx = (H / 2 + dy) * W + (W / 2 + dx);
            totalElev += bedHeight[idx];
            totalWater += waterDepth[idx];
            totalWaveMomentum += Math.abs(momentumY[idx]);
            totalSat += saturation[idx];
            count++;
          }
        }

        const avgElev = totalElev / count;
        const avgWater = totalWater / count;
        const avgSat = (totalSat / count) * 100;
        const baseElev = initialKeepElev || 0.45;

        const heightRatio = Math.max(0, Math.min(1.0, (avgElev - 0.05) / (baseElev - 0.05)));
        const submergencePenalty = Math.min(1.0, avgWater / 0.15);

        const health = Math.max(0, Math.min(100, Math.round((heightRatio * 100) * (1.0 - submergencePenalty * 0.8))));
        setKeepHealth(health);

        // Non-linear wave energy calculation (rhythmic wave impact spikes)
        const waveEnergy = isTideActive
          ? (totalWaveMomentum * 12.0) + (Math.sin(frameCount * 0.15) > 0 ? Math.sin(frameCount * 0.15) * 35.0 : 0)
          : 0;

        // Push telemetry point to history buffer
        setTelemetryHistory((prev) => {
          const next = [
            ...prev,
            {
              timeSec: frameCount / 60.0,
              keepHealth: health,
              waveEnergy: Math.round(waveEnergy * 10) / 10,
              saturationPercent: Math.round(avgSat * 10) / 10,
              sandMassM3: Math.round(avgElev * 0.85 * 100) / 100
            }
          ];
          return next.slice(-60); // Retain last 60 telemetry points
        });

        if (isTideActive && health <= 10 && !isAutopsyOpen) {
          setIsAutopsyOpen(true);
          setSurvivalTime(frameCount / 60.0);
          pauseTide();
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isTideActive, frameCount, isAutopsyOpen, initialKeepElev, pauseTide]);

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
    setIsScorecardOpen(false);
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
        lightingPreset={activeLighting}
      />

      {/* Top Glassmorphic Telemetry HUD Header */}
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
          activeLighting={activeLighting}
          activeBeachPreset={activeBeachPreset}
          onChangeLighting={setActiveLighting}
          onChangeBeachPreset={setActiveBeachPreset}
          onChangeSpeed={handleSpeedChange}
          onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
          onToggleContours={() => setShowContours((prev) => !prev)}
          onOpenScorecard={() => setIsScorecardOpen(true)}
          onShare={handleShareCastle}
          onStartTide={startTide}
          onPauseTide={pauseTide}
          onReset={handleRestart}
        />
      )}

      {/* Interactive Telemetry Scorecard Modal */}
      <IntegrityScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        telemetryHistory={telemetryHistory}
        currentKeepHealth={keepHealth}
      />

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
