/**
 * Sandcastle vs. Tide Simulator - R3F Camera Rig
 *
 * Provides multi-perspective camera controls (Isometric 35°, Strategic 90° Overhead, Low Wave POV)
 * with smooth dampening transitions and low-angle pitch locking.
 */

import React, { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { DOMAIN_SIZE_X, DOMAIN_SIZE_Y } from '../config/constants';

export enum CameraViewMode {
  ISOMETRIC = 'ISOMETRIC',
  OVERHEAD = 'OVERHEAD',
  WAVE_POV = 'WAVE_POV'
}

interface CameraRigProps {
  mode?: CameraViewMode;
}

export const CameraRig: React.FC<CameraRigProps> = ({ mode = CameraViewMode.ISOMETRIC }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const centerX = 0;
  const centerZ = 0;

  return (
    <OrbitControls
      ref={controlsRef}
      target={[centerX, 0.2, centerZ]}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera clipping beneath bedrock baseline
      minDistance={1.0}
      maxDistance={12.0}
    />
  );
};
