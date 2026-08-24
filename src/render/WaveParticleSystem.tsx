/**
 * Sandcastle vs. Tide Simulator - GPU Wave Spray & Foam Particle Engine
 *
 * Instantiates a Three.js Particle System emitting dynamic sea spray droplets
 * along breaking wave crests (|v| > 0.3 m/s) and sand wall collisions.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GRID_WIDTH, GRID_HEIGHT, DOMAIN_SIZE_X, DOMAIN_SIZE_Y } from '../config/constants';
import { WorkerBridge } from '../bridge/WorkerBridge';

const PARTICLE_COUNT = 600;

export const WaveParticleSystem: React.FC<{ isBioluminescent?: boolean }> = ({
  isBioluminescent = false
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const life = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * DOMAIN_SIZE_X;
      pos[i * 3 + 1] = (Math.random() - 0.5) * DOMAIN_SIZE_Y;
      pos[i * 3 + 2] = -10.0; // Hide initially below ground
      life[i] = 0;
    }

    return { positions: pos, velocities: vel, lifetimes: life };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const particleColor = useMemo(
    () => (isBioluminescent ? new THREE.Color('#38bdf8') : new THREE.Color('#f8fafc')),
    [isBioluminescent]
  );

  useFrame((_, delta) => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();
    if (!buffers || !geometry) return;

    const { waterDepth, momentumY, bedHeight } = buffers;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const cellWidth = DOMAIN_SIZE_X / W;
    const cellHeight = DOMAIN_SIZE_Y / H;

    let pIdx = 0;

    // Scan water grid for wave crests (|v| > 0.25 m/s) and spawn spray particles
    for (let y = 10; y < H - 10; y += 4) {
      for (let x = 10; x < W - 10; x += 4) {
        if (pIdx >= PARTICLE_COUNT) break;

        const idx = y * W + x;
        const h = waterDepth[idx];
        const my = momentumY[idx];
        const speed = Math.abs(my) / Math.max(0.001, h);

        if (h > 0.005 && speed > 0.25 && lifetimes[pIdx] <= 0) {
          // Spawn spray particle at wave crest
          const worldX = (x / W - 0.5) * DOMAIN_SIZE_X;
          const worldZ = (y / H - 0.5) * DOMAIN_SIZE_Y;
          const worldY = bedHeight[idx] + h;

          posArr[pIdx * 3] = worldX + (Math.random() - 0.5) * cellWidth;
          posArr[pIdx * 3 + 1] = worldY + 0.02;
          posArr[pIdx * 3 + 2] = -worldZ + (Math.random() - 0.5) * cellHeight;

          velocities[pIdx * 3] = (Math.random() - 0.5) * 0.1;
          velocities[pIdx * 3 + 1] = 0.15 + Math.random() * 0.1; // Upward spray
          velocities[pIdx * 3 + 2] = -0.2;                      // Inland momentum

          lifetimes[pIdx] = 0.6 + Math.random() * 0.4;
          pIdx++;
        }
      }
    }

    // Update active particle positions with gravity and velocity decay
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        posArr[i * 3] += velocities[i * 3] * delta;
        posArr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        posArr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        velocities[i * 3 + 1] -= 0.6 * delta; // Gravity pull

        if (lifetimes[i] <= 0) {
          posArr[i * 3 + 1] = -10.0; // Hide below terrain when dead
        }
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color={particleColor}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
