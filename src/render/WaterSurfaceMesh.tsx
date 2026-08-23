/**
 * Sandcastle vs. Tide Simulator - R3F Water Surface Mesh
 *
 * Renders water layer plane bound to water depth and bed height DataTextures.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GRID_WIDTH, GRID_HEIGHT, DOMAIN_SIZE_X, DOMAIN_SIZE_Y } from '../config/constants';
import { WorkerBridge } from '../bridge/WorkerBridge';
import { waterVertexShader, waterFragmentShader } from './shaders/waterShader';

export const WaterSurfaceMesh: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { waterTexture, bedTexture } = useMemo(() => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();

    const emptyBuffer = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
    const waterData = buffers ? buffers.waterDepth : emptyBuffer;
    const bedData = buffers ? buffers.bedHeight : emptyBuffer;

    const wTex = new THREE.DataTexture(waterData, GRID_WIDTH, GRID_HEIGHT, THREE.RedFormat, THREE.FloatType);
    const bTex = new THREE.DataTexture(bedData, GRID_WIDTH, GRID_HEIGHT, THREE.RedFormat, THREE.FloatType);

    [wTex, bTex].forEach((tex) => {
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    });

    return { waterTexture: wTex, bedTexture: bTex };
  }, []);

  const uniforms = useMemo(
    () => ({
      uWaterDepthMap: { value: waterTexture },
      uBedHeightMap: { value: bedTexture },
      uGridResolution: { value: GRID_WIDTH },
      uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      uSunColor: { value: new THREE.Color(1.0, 0.95, 0.85) },
      uWaterColor: { value: new THREE.Color(0.12, 0.55, 0.78) },
      uDeepWaterColor: { value: new THREE.Color(0.04, 0.22, 0.42) },
      uTime: { value: 0 }
    }),
    [waterTexture, bedTexture]
  );

  useFrame((state) => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();

    if (buffers) {
      waterTexture.image.data = buffers.waterDepth;
      bedTexture.image.data = buffers.bedHeight;

      waterTexture.needsUpdate = true;
      bedTexture.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[DOMAIN_SIZE_X, DOMAIN_SIZE_Y, GRID_WIDTH - 1, GRID_HEIGHT - 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
