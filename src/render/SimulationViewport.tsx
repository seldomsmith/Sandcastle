/**
 * Sandcastle vs. Tide Simulator - R3F Simulation Viewport
 *
 * Primary 3D canvas container mounting dynamic lighting presets, sand terrain mesh,
 * water surface layer, wave particle systems, 3D hover telemetry reticle, and camera rig.
 */

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SandTerrainMesh } from './SandTerrainMesh';
import { WaterSurfaceMesh } from './WaterSurfaceMesh';
import { WaveParticleSystem } from './WaveParticleSystem';
import { TelemetryReticle } from './TelemetryReticle';
import { CameraRig } from './CameraRig';
import { PointerRaycaster } from './PointerRaycaster';
import { WorkerBridge } from '../bridge/WorkerBridge';
import { ToolType } from '../types/simulation';
import { LightingPreset, LIGHTING_PRESETS } from '../config/lightingPresets';

interface SimulationViewportProps {
  activeTool: ToolType;
  brushRadius: number;
  brushStrength: number;
  showHeatmap?: boolean;
  showContours?: boolean;
  isOrbitLocked?: boolean;
  lightingPreset?: LightingPreset;
}

export const SimulationViewport: React.FC<SimulationViewportProps> = ({
  activeTool,
  brushRadius,
  brushStrength,
  showHeatmap = false,
  showContours = false,
  isOrbitLocked = false,
  lightingPreset = LIGHTING_PRESETS[0]
}) => {
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  useEffect(() => {
    const bridge = WorkerBridge.getInstance();
    bridge.initialize().then(() => {
      setIsBridgeReady(true);
    });
  }, []);

  if (!isBridgeReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-sky-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">INITIALIZING PHYSICS ENGINE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-slate-900 overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 3.0, 3.8], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={[lightingPreset.skyColor]} />

        {/* Dynamic Coastal Environment Lighting Presets (Task 2) */}
        <ambientLight intensity={0.65} color={lightingPreset.ambientColor} />
        <directionalLight
          position={lightingPreset.sunPosition}
          intensity={1.3}
          color={lightingPreset.sunColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Dynamic Simulation Meshes */}
        <SandTerrainMesh showHeatmap={showHeatmap} showContours={showContours} />
        <WaterSurfaceMesh />

        {/* GPU Spray Particle Engine & 3D Hover Telemetry Reticle */}
        <WaveParticleSystem isBioluminescent={lightingPreset.bioluminescentFoam} />
        <TelemetryReticle />

        {/* 3D Pointer Raycasting Sculpting Engine */}
        <PointerRaycaster
          activeTool={activeTool}
          brushRadius={brushRadius}
          brushStrength={brushStrength}
        />

        {/* Multi-Perspective Orbital Camera Rig */}
        <CameraRig isOrbitLocked={isOrbitLocked} />
      </Canvas>
    </div>
  );
};
