/**
 * Sandcastle vs. Tide Simulator - R3F Sand Terrain Mesh
 *
 * Renders a single 256x256 displaced plane geometry bound to the SharedArrayBuffer
 * Float32Array via DataTextures with zero-allocation GPU updates, heatmap, and contour toggles.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GRID_WIDTH, GRID_HEIGHT, DOMAIN_SIZE_X, DOMAIN_SIZE_Y } from '../config/constants';
import { WorkerBridge } from '../bridge/WorkerBridge';
import { terrainVertexShader, terrainFragmentShader } from './shaders/terrainShader';

interface SandTerrainMeshProps {
  showHeatmap?: boolean;
  showContours?: boolean;
}

export const SandTerrainMesh: React.FC<SandTerrainMeshProps> = ({
  showHeatmap = false,
  showContours = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { bedTexture, saturationTexture, compactionTexture } = useMemo(() => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();

    const emptyBuffer = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
    const bedData = buffers ? buffers.bedHeight : emptyBuffer;
    const satData = buffers ? buffers.saturation : emptyBuffer;
    const compData = buffers ? buffers.compaction : emptyBuffer;

    const bTex = new THREE.DataTexture(bedData, GRID_WIDTH, GRID_HEIGHT, THREE.RedFormat, THREE.FloatType);
    const sTex = new THREE.DataTexture(satData, GRID_WIDTH, GRID_HEIGHT, THREE.RedFormat, THREE.FloatType);
    const cTex = new THREE.DataTexture(compData, GRID_WIDTH, GRID_HEIGHT, THREE.RedFormat, THREE.FloatType);

    [bTex, sTex, cTex].forEach((tex) => {
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    });

    return { bedTexture: bTex, saturationTexture: sTex, compactionTexture: cTex };
  }, []);

  const uniforms = useMemo(
    () => ({
      uBedHeightMap: { value: bedTexture },
      uSaturationMap: { value: saturationTexture },
      uCompactionMap: { value: compactionTexture },
      uGridResolution: { value: GRID_WIDTH },
      uDomainSize: { value: DOMAIN_SIZE_X },
      uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      uSunColor: { value: new THREE.Color(1.0, 0.95, 0.85) },
      uAmbientColor: { value: new THREE.Color(0.25, 0.28, 0.35) },
      uTime: { value: 0 },
      uShowHeatmap: { value: showHeatmap },
      uShowContours: { value: showContours }
    }),
    [bedTexture, saturationTexture, compactionTexture, showHeatmap, showContours]
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uShowHeatmap.value = showHeatmap;
      materialRef.current.uniforms.uShowContours.value = showContours;
    }
  }, [showHeatmap, showContours]);

  useFrame((state) => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();

    if (buffers) {
      bedTexture.image.data = buffers.bedHeight;
      saturationTexture.image.data = buffers.saturation;
      compactionTexture.image.data = buffers.compaction;

      bedTexture.needsUpdate = true;
      saturationTexture.needsUpdate = true;
      compactionTexture.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[DOMAIN_SIZE_X, DOMAIN_SIZE_Y, GRID_WIDTH - 1, GRID_HEIGHT - 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={terrainVertexShader}
        fragmentShader={terrainFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
