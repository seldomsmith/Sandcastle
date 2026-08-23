# Sandcastle vs. Tide Simulator

A real-time, physics-informed strategy and coastal erosion simulator built with **React 19**, **TypeScript**, **React Three Fiber (R3F)**, **Three.js**, and an **Extended Piped-Flow Cellular Automaton (EPF-CA)** fluid engine executing on a dedicated Web Worker.

![Sandcastle Simulator](https://img.shields.br/badge/Status-Production_Ready-emerald)
![License](https://img.shields.br/badge/License-MIT-blue)

---

## 🌊 Key Features

- **Decoupled Architecture**: Fixed 60 Hz physics tick loop running in a dedicated Web Worker, decoupled from main-thread GPU rendering (60–120 FPS).
- **Zero-Copy Shared Memory**: SharedArrayBuffer layout containing 7 Float32 matrix fields (Bed Height, Water Depth, X/Y Momentum, Compaction, Saturation, Material Flags) with atomic locks (`Atomics`).
- **Coastal Hydrodynamics**: 2D Extended Piped-Flow Cellular Automaton fluid engine with Flather radiation absorption at seaward boundary ($Y=0$) and 3-sided open drainage sinks ($X=0, X=255, Y=255$).
- **Geotechnical Erosion**: Hydrodynamic shear stress sand detachment, underwater saturation diffusion, and 8-neighbour distance-weighted slumping.
- **Custom GPU Shaders**: Finite difference vertex normal reconstruction, tri-planar PBR multi-texture fragment blending, dynamic shoreline edge foam lines, and a toggleable diagnostic hydraulic shear stress heatmap overlay.
- **Glassmorphic UI HUD**: Floating tool palette (Shovel, Dig, Tamper, Stones), telemetry header bar, tide controls, and post-mortem failure autopsy modal.
- **Blueprint Sharing**: Run-Length Encoding (RLE) payload generator supporting Base64 castle URL sharing.

---

## 🛠️ Project Structure

```
src/
├── config/             # Physics constants & coastal scenario presets
├── types/              # TypeScript interfaces, Worker messages, tool enums
├── engine/             # Web Worker thread (EPF-CA fluid solver, Geotechnical, Culverts)
│   ├── SharedMemory.ts
│   ├── PipedFlowSolver.ts
│   ├── GeotechnicalEngine.ts
│   ├── CulvertEngine.ts
│   └── simulation.worker.ts
├── bridge/             # Main-thread WorkerBridge client singleton
├── render/             # React Three Fiber canvas, camera rig, pointer raycaster, GLSL shaders
│   ├── shaders/
│   │   ├── terrainShader.ts
│   │   └── waterShader.ts
│   ├── SandTerrainMesh.tsx
│   ├── WaterSurfaceMesh.tsx
│   ├── PointerRaycaster.tsx
│   └── SimulationViewport.tsx
├── hooks/              # Simulation state management hook (useSimulation.ts)
├── components/         # Glassmorphic HUD, ToolPalette, HUDHeader, PostMortemModal
├── audio/              # Web Audio API procedural sound engine (SoundManager.ts)
├── utils/              # RLE blueprint encoder & Base64 serialization
└── App.tsx             # Root layout container
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### Installation
```bash
# Clone repository
git clone https://github.com/seldomsmith/Frequency.git
cd Frequency

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## ⚙️ SharedArrayBuffer & Cross-Origin Isolation

To enable zero-copy `SharedArrayBuffer` support in modern web browsers, your web server must set the following HTTP headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Vite is pre-configured with these headers in local dev mode. If `SharedArrayBuffer` is unsupported by the browser host, the application automatically falls back to an `ArrayBuffer` model.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
