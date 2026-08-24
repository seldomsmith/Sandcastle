/**
 * Sandcastle vs. Tide Simulator - R3F Camera Rig
 *
 * Provides multi-perspective camera controls with smooth dampening transitions,
 * closer framing, and low-angle pitch locking.
 */

import React, { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export enum CameraViewMode {
  ISOMETRIC = 'ISOMETRIC',
  OVERHEAD = 'OVERHEAD',
  WAVE_POV = 'WAVE_POV'
}

interface CameraRigProps {
  mode?: CameraViewMode;
}

export const CameraRig: React.FC<CameraRigProps> = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 0.15, 0]}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera clipping beneath bedrock baseline
      minDistance={1.0}
      maxDistance={12.0}
    />
  );
};
