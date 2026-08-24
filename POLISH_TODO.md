# 🎨 Sandcastle vs. Tide Simulator - Visual & UI Polish Backlog (POLISH_TODO.md)

This document tracks the 10 ultra-premium visual, graphical, and UI polish sub-tasks designed to eliminate any "pixelly" or basic feel and elevate the simulation to a AAA WebGL experience.

---

## 📋 Visual & UI Polish Task Backlog

- [ ] **Task 1: Water Refraction & Caustics Shader**
  - [ ] Implement animated GLSL caustics light projection on underwater terrain.
  - [ ] Add underwater chromatic refraction distortion to `waterShader.ts`.

- [ ] **Task 2: Dynamic Time-of-Day Lighting Presets**
  - [ ] Implement **Golden Hour Sunset** preset (low orange sun, warm magenta water reflections).
  - [ ] Implement **High Noon Tropical** preset (bright turquoise water, crisp highlights).
  - [ ] Implement **Night Tide** preset (indigo moonlight with bioluminescent glowing wave foam).

- [ ] **Task 3: Wet Sand High-Gloss Mirror Sheen (PBR Wetness Map)**
  - [ ] Update `terrainShader.ts` with a high-gloss PBR wetness map (roughness 0.05 on wetted sand).
  - [ ] Create sun specular reflections on receding wet sand faces.

- [ ] **Task 4: Smooth GLSL Bilinear Normal Interpolation (Pixel Elimination)**
  - [ ] Apply bicubic normal interpolation in GLSL terrain vertex shader to smooth grid steps on steep sand walls.
  - [ ] Ensure water surface and sand turrets render as silky 3D curves.

- [ ] **Task 5: Three.js GPU Foam Particles & Wave Splash Spray**
  - [ ] Create GPU particle system for crashing wave crests.
  - [ ] Add splash droplets when waves collide with 90° sand walls.

- [ ] **Task 6: Cinematic Camera Angle Presets**
  - [ ] Add **Beach Level GoPro Cam** (low ground-level angle facing incoming waves).
  - [ ] Add **Drone Overhead Inspection** (top-down orthographic view).
  - [ ] Add **Wave Tracking Cam** (camera smoothly follows leading wave front).

- [ ] **Task 7: Spatial Web Audio Soundscape Engine**
  - [ ] Implement Web Audio API procedural ocean surf sound synthesis.
  - [ ] Add spatial panning based on wave velocity and water depth.
  - [ ] Add tactile shovel scoop, tamper compaction, and water bubbling SFX.

- [ ] **Task 8: VisionOS-Style Glassmorphic UI & 3D Glowing Reticle**
  - [ ] Upgrade HUD with frosted glass panels, glowing reticle indicators on sand, and spring transitions.
  - [ ] Add interactive tool icons with hover micro-animations.

- [ ] **Task 9: Hover 3D Micro-Telemetry Reticle HUD**
  - [ ] Create hovering 3D telemetry reticle showing exact Water Depth (cm), Sand Elevation (cm), and Velocity (m/s) in real time.

- [ ] **Task 10: High-Resolution PBR Sand & Quartz Glint Texture Maps**
  - [ ] Load high-resolution PBR sand grain normal and roughness textures.
  - [ ] Add subtle sparkling quartz glints under direct sun lighting.
