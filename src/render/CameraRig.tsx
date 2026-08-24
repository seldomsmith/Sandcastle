/**
 * Sandcastle vs. Tide Simulator - R3F Camera Rig
 *
 * Provides multi-perspective camera controls with smooth dampening transitions,
 * closer framing, low-angle pitch locking, and interactive orbit locking.
 */

import React, { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraRigProps {
  isOrbitLocked?: boolean;
}

export const CameraRig: React.FC<CameraRigProps> = ({ isOrbitLocked = false }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 0.15, 0]}
      enabled={!isOrbitLocked}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera clipping beneath bedrock baseline
      minDistance={1.0}
      maxDistance={12.0}
    />
  );
};
