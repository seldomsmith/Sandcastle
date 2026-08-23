/**
 * Sandcastle vs. Tide Simulator - Pointer Raycaster & Brush Reticle
 *
 * Casts 3D ray from pointer to terrain heightfield, projects holographic reticle,
 * and dispatches tool brush commands to the simulation bridge.
 */

import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
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

  const dispatchBrush = (worldPoint: THREE.Vector3) => {
    // Translate world 3D position [-3.2..3.2] to grid indices [0..255]
    const gridX = ((worldPoint.x + DOMAIN_SIZE_X / 2) / DOMAIN_SIZE_X) * GRID_WIDTH;
    const gridY = ((worldPoint.z + DOMAIN_SIZE_Y / 2) / DOMAIN_SIZE_Y) * GRID_HEIGHT;

    const bridge = WorkerBridge.getInstance();
    bridge.applyTool(activeTool, gridX, gridY, brushRadius, brushStrength);
  };

  return (
    <>
      {/* Invisible raycast interaction plane */}
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
        <mesh position={[hoverPos.x, hoverPos.y + 0.01, hoverPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[(brushRadius * DOMAIN_SIZE_X / GRID_WIDTH) * 0.85, (brushRadius * DOMAIN_SIZE_X / GRID_WIDTH), 32]} />
          <meshBasicMaterial color={activeTool === ToolType.DIG ? 0xef4444 : activeTool === ToolType.COMPACT ? 0xf59e0b : 0x38bdf8} side={THREE.DoubleSide} transparent opacity={0.75} />
        </mesh>
      )}
    </>
  );
};
