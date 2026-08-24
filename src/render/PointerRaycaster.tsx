/**
 * Sandcastle vs. Tide Simulator - Pointer Raycaster & Brush Reticle
 *
 * Casts 3D ray directly to terrain heightfield, projects holographic reticle,
 * and dispatches sculpting tool brush commands to the simulation bridge.
 */

import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { DOMAIN_SIZE_X, DOMAIN_SIZE_Y, GRID_WIDTH, GRID_HEIGHT } from '../config/constants';
import { WorkerBridge } from '../bridge/WorkerBridge';
import { ToolType } from '../types/simulation';

interface PointerRaycasterProps {
  activeTool: ToolType;
  brushRadius: number;
  brushStrength: number;
}

export const PointerRaycaster: React.FC<PointerRaycasterProps> = ({
  activeTool,
  brushRadius,
  brushStrength
}) => {
  const [hoverPos, setHoverPos] = useState<THREE.Vector3 | null>(null);
  const isPointerDownRef = useRef(false);

  const dispatchBrush = (worldPoint: THREE.Vector3) => {
    // Correct 1:1 mapping from 3D world coordinates [-3.2..3.2] to 2D grid cell indices [0..255]
    // worldPoint.x [-3.2..3.2] maps to gridX [0..255]
    // worldPoint.z [-3.2..3.2] maps to gridY [0..255]
    const normX = (worldPoint.x + DOMAIN_SIZE_X / 2.0) / DOMAIN_SIZE_X;
    const normY = (worldPoint.z + DOMAIN_SIZE_Y / 2.0) / DOMAIN_SIZE_Y;

    const gridX = Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(normX * GRID_WIDTH)));
    const gridY = Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(normY * GRID_HEIGHT)));

    const bridge = WorkerBridge.getInstance();
    bridge.applyTool(activeTool, gridX, gridY, brushRadius, brushStrength * 0.5);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === ToolType.NONE) return;

    e.stopPropagation();
    const point = e.point;
    setHoverPos(point);

    if (isPointerDownRef.current) {
      dispatchBrush(point);
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === ToolType.NONE || e.button !== 0) return;

    e.stopPropagation();
    isPointerDownRef.current = true;
    dispatchBrush(e.point);
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  return (
    <>
      {/* Interaction Raycast mesh aligned precisely with terrain mesh */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoverPos(null);
          isPointerDownRef.current = false;
        }}
        visible={false}
      >
        <planeGeometry args={[DOMAIN_SIZE_X, DOMAIN_SIZE_Y]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>

      {/* Holographic Reticle Overlay */}
      {hoverPos && activeTool !== ToolType.NONE && (
        <mesh position={[hoverPos.x, hoverPos.y + 0.02, hoverPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[(brushRadius * DOMAIN_SIZE_X / GRID_WIDTH) * 0.8, (brushRadius * DOMAIN_SIZE_X / GRID_WIDTH), 32]} />
          <meshBasicMaterial
            color={activeTool === ToolType.DIG ? 0xef4444 : activeTool === ToolType.COMPACT ? 0xf59e0b : 0x38bdf8}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}
    </>
  );
};
