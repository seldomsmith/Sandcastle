/**
 * Sandcastle vs. Tide Simulator - 3D Hover Telemetry Reticle HUD
 *
 * Floating 3D reticle tracking mouse cursor position over sand terrain,
 * reading SharedArrayBuffer data to show live Water Depth (cm), Sand Elevation (cm), and Velocity (m/s).
 */

import React, { useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { GRID_WIDTH, GRID_HEIGHT, DOMAIN_SIZE_X, DOMAIN_SIZE_Y } from '../config/constants';
import { WorkerBridge } from '../bridge/WorkerBridge';

export const TelemetryReticle: React.FC = () => {
  const { raycaster, camera, pointer } = useThree();
  const [reticleData, setReticleData] = useState<{
    position: [number, number, number];
    waterDepthCm: number;
    sandElevationCm: number;
    velocityMs: number;
    isVisible: boolean;
  }>({
    position: [0, 0, 0],
    waterDepthCm: 0,
    sandElevationCm: 0,
    velocityMs: 0,
    isVisible: false
  });

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    const hasIntersect = raycaster.ray.intersectPlane(groundPlane, intersectPoint);

    if (
      hasIntersect &&
      Math.abs(intersectPoint.x) <= DOMAIN_SIZE_X / 2 &&
      Math.abs(intersectPoint.z) <= DOMAIN_SIZE_Y / 2
    ) {
      const bridge = WorkerBridge.getInstance();
      const buffers = bridge.getBuffers();

      if (buffers) {
        const { bedHeight, waterDepth, momentumY } = buffers;
        const normX = (intersectPoint.x / DOMAIN_SIZE_X) + 0.5;
        const normY = 0.5 - (intersectPoint.z / DOMAIN_SIZE_Y);

        const gx = Math.min(GRID_WIDTH - 1, Math.max(0, Math.floor(normX * GRID_WIDTH)));
        const gy = Math.min(GRID_HEIGHT - 1, Math.max(0, Math.floor(normY * GRID_HEIGHT)));
        const idx = gy * GRID_WIDTH + gx;

        const b = bedHeight[idx];
        const h = waterDepth[idx];
        const my = momentumY[idx];
        const vel = Math.abs(my) / Math.max(0.001, h);

        const newb = Math.round(b * 100 * 10) / 10;
        const newh = Math.round(h * 100 * 10) / 10;
        const newvel = Math.round(vel * 100) / 100;

        // Avoid unnecessary React state churn on identical values
        if (
          !reticleData.isVisible ||
          reticleData.sandElevationCm !== newb ||
          reticleData.waterDepthCm !== newh ||
          reticleData.velocityMs !== newvel
        ) {
          setReticleData({
            position: [intersectPoint.x, b + h + 0.05, intersectPoint.z],
            waterDepthCm: newh,
            sandElevationCm: newb,
            velocityMs: newvel,
            isVisible: true
          });
        }
      }
    } else if (reticleData.isVisible) {
      setReticleData((prev) => ({ ...prev, isVisible: false }));
    }
  });

  if (!reticleData.isVisible) return null;

  return (
    <group position={reticleData.position}>
      <Html center pointerEvents="none">
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            padding: '6px 10px',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ color: '#94a3b8' }}>Elev:</span>{' '}
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{reticleData.sandElevationCm} cm</span>
          </div>
          <div style={{ height: '10px', width: '1px', backgroundColor: '#334155' }} />
          <div>
            <span style={{ color: '#94a3b8' }}>Water:</span>{' '}
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{reticleData.waterDepthCm} cm</span>
          </div>
          <div style={{ height: '10px', width: '1px', backgroundColor: '#334155' }} />
          <div>
            <span style={{ color: '#94a3b8' }}>Vel:</span>{' '}
            <span style={{ color: '#34d399', fontWeight: 700 }}>{reticleData.velocityMs} m/s</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
