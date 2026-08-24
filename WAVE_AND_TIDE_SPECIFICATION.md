# Sandcastle vs. Tide Simulator - Wave & Tide Dynamics Complete Technical Specification

**Document Version**: 1.0.0  
**Engine Architecture**: Extended Piped-Flow Cellular Automaton (EPF-CA) with WebAssembly / Web Worker Shared Memory  
**Target Repository**: `https://github.com/seldomsmith/Sandcastle.git`  
**Git Commit Hash**: `9e28d00`  
**Status**: 🔒 IMMUTABLE GOLDEN BASELINE SPECIFICATION

---

## 1. 🌊 Executive Summary & Engine Overview

The **Sandcastle vs. Tide Hydrodynamics Engine** is a high-performance 2D fluid solver running inside a dedicated Web Worker at 60 Hz over a $256 \times 256$ spatial grid ($6.4\text{m} \times 6.4\text{m}$ domain). 

The engine produces **100% physically emergent shallow-water wave swash, backwash drainage, and progressive tidal ratcheting** through three integrated sub-systems:
1. **`WaveGenerator.ts`**: Governs seaward boundary conditions ($Y = 0$), discrete 8.0-second periodic wave cycles, and macro base tide ratcheting.
2. **`PipedFlowSolver.ts`**: Calculates 2D hydrostatic head pipe fluxes, momentum advection, strict outflow safety scaling, and Laplacian spatial depth smoothing ($\nu = 0.15$).
3. **`waterShader.ts`**: Renders R3F GLSL vertex displacement with bed collapse thresholding ($h < 0.002\text{m}$) and whitecap crest foam shaders.

---

## 2. ⏱️ Discrete Periodic Surge-and-Ebb Wave Engine (`WaveGenerator.ts`)

Wave generation is driven by a **Discrete Periodic Surge-and-Ebb Cycle** rather than continuous sine-wave dumping, preventing boundary over-drainage and firehose defects.

### 2.1 Wave Cycle & Phase Definitions

- **Wave Period ($T_{\text{wave}} = 8.0\text{ seconds}$ per wave cycle)**:
  - **Surge Phase ($0.0\text{s} \le t_{\text{cycle}} < 3.5\text{s}$)**:
    - **Injected Crest Height**:
      $$h_{\text{surge}}(t) = 0.02\text{m} + 0.02\text{m} \cdot \sin\left(\frac{\pi \cdot t_{\text{cycle}}}{3.5}\right)$$
    - **Target Boundary Elevation**:
      $$z_{\text{crest}}(t) = z_{\text{macro\_tide}}(t) + h_{\text{surge}}(t)$$
    - **Boundary Depth**:
      $$h(x, 0) = \max\left(0.01\text{m}, z_{\text{crest}}(t) - b(x, 0)\right)$$
    - **Forward Surge Kinetic Velocity**:
      $$v_y(x, 0) = +1.2\text{ m/s} \implies M_y(x, 0) = h(x, 0) \cdot 1.2$$
  - **Ebb / Backwash Phase ($3.5\text{s} \le t_{\text{cycle}} < 8.0\text{s}$)**:
    - Water injection at row $Y = 0$ is **shut off completely**.
    - If local head $(b + h)_{x,0} > z_{\text{macro\_tide}}$, backwash drains seaward off row $Y = 0$:
      $$h(x, 0) = \max\left(z_{\text{macro\_tide}} - b(x, 0), h(x, 0) \cdot 0.75\right)$$
      $$M_y(x, 0) = -h(x, 0) \cdot 0.5 \quad (\text{Seaward outflow velocity } -0.5\text{ m/s})$$
    - Otherwise, boundary depth clamps smoothly to current macro tide:
      $$h(x, 0) = \max(0, z_{\text{macro\_tide}} - b(x, 0)), \quad M_y(x, 0) = 0$$

### 2.2 Macro Base Tide Ratchet Math

The underlying astronomical mean sea level ratchets upward progressively every completed 8-second wave cycle:

$$\text{cycleIndex} = \left\lfloor \frac{t_{\text{sim}}}{8.0} \right\rfloor$$

$$\eta_{\text{macro\_tide}}(t) = \min\left(0.40\text{m}, \text{cycleIndex} \cdot 0.02\text{m}\right)$$

- **Physical Effect**: Wave 1 starts its run-up at $0.00\text{m}$ sea level. Wave 2 starts at $+0.02\text{m}$. Wave 3 starts at $+0.04\text{m}$. Each wave surges further inland up the beach slope than the previous wave!

---

## 3. 🌊 Hydrodynamic Pipe Flux & Numerical Stability Engine (`PipedFlowSolver.ts`)

Fluid flow between adjacent grid cells $(i, j)$ is modeled using virtual pipe connections driven by total hydrostatic head differentials ($H_{i,j} = b_{i,j} + h_{i,j}$).

### 3.1 Virtual Pipe Outflow Equation

For cell $(i, j)$ connected to neighbor $N \in \{\text{Right, Left, Top, Bottom}\}$:

$$\Delta H_N = H_{i,j} - H_N$$

$$F_{N}^{\text{new}} = \max\left(0, F_N + \Delta t \cdot g \cdot \frac{A_{\text{pipe}}}{L_{\text{pipe}}} \cdot \Delta H_N\right)$$

where:
- $\Delta t = \frac{1}{60}\text{ s}$ ($0.01667\text{s}$)
- $g = 9.81\text{ m/s}^2$
- $A_{\text{pipe}} = 0.0004\text{ m}^2$
- $L_{\text{pipe}} = 0.025\text{ m}$

### 3.2 Dynamic Manning Wet-Bed Friction Scaling ($C_f$)

Friction coefficient $C_f$ scales dynamically based on soil saturation ($S$) and water depth ($h$):

$$C_f = \begin{cases} 0.012 & \text{if } S > 0.7 \text{ or } h > 0.005\text{m} \quad (\text{Wet Saturated Beach face}) \\ 0.060 & \text{if } S \le 0.7 \text{ and } h \le 0.005\text{m} \quad (\text{Dry Porous Sand}) \end{cases}$$

$$\text{DampingFactor} = \max\left(0.2, 1.0 - C_f \cdot \Delta t \cdot 10.0\right)$$

$$F_N^{\text{damped}} = F_N \cdot \text{DampingFactor}$$

### 3.3 Strict Outflow Safety Factor (0.5 Outflow Scaling)

To prevent negative head overshoots and numerical oscillation spires, total cell outflow volume is scaled to a strict safety factor of $0.5$:

$$V_{\text{out\_total}} = \sum_{N} F_N^{\text{damped}} \cdot \Delta t$$

$$V_{\text{max\_safe}} = h_{i,j} \cdot \Delta x^2 \cdot 0.5$$

$$\text{If } V_{\text{out\_total}} > V_{\text{max\_safe}} \implies F_N = F_N^{\text{damped}} \cdot \left(\frac{V_{\text{max\_safe}}}{V_{\text{out\_total}}}\right)$$

### 4.4 Horizontal Velocity Clamping ($2.0\text{ m/s}$ Max)

To prevent high-velocity instability spikes:

$$u_x = \frac{(F_{\text{in\_R}} - F_{\text{out\_L}}) + (F_{\text{out\_R}} - F_{\text{in\_L}})}{2 \cdot \Delta x}$$

$$u_y = \frac{(F_{\text{in\_T}} - F_{\text{out\_B}}) + (F_{\text{out\_T}} - F_{\text{in\_B}})}{2 \cdot \Delta x}$$

$$\max(|u_x|, |u_y|) \le 2.0\text{ m/s}$$

$$M_x(i, j) = u_x \cdot h_{i,j}, \quad M_y(i, j) = u_y \cdot h_{i,j}$$

### 3.5 Laplacian Viscosity Spatial Diffusion Filter ($\nu = 0.15$)

Every simulation tick, a lightweight spatial diffusion step is applied to water depth ($h$) across the grid to instantly smooth high-frequency numerical spires:

$$h_{i,j}^{\text{smoothed}} = h_{i,j} + \nu \cdot \left(\frac{h_{i-1,j} + h_{i+1,j} + h_{i,j-1} + h_{i,j+1}}{4} - h_{i,j}\right)$$

where $\nu = 0.15$.

---

## 4. 🎨 WebGL Water Shader & Surface Normalization (`waterShader.ts`)

### 4.1 Vertex Collapse Thresholding ($h < 0.002\text{m}$)

To eliminate floating blue planes and detached mesh artifacts, vertex Z-displacement is calculated as follows:

```glsl
float b = texture2D(uBedHeightMap, uv).r;
float h = texture2D(uWaterDepthMap, uv).r;

// If water depth is below 2mm, collapse vertex directly onto terrain bed
float effectiveWaterDepth = h < 0.002 ? 0.0 : h;
float totalElevation = b + effectiveWaterDepth;

vec3 displacedPos = position;
displacedPos.z = totalElevation;
gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(displacedPos, 1.0);
```

### 4.2 Shoreline Foam & Crest Whitecaps

Fragment shader blends shoreline edge foam along shallow borders ($h < 0.015\text{m}$) and procedural whitecap froth along turbulent wave crests:

```glsl
float foamLine = 1.0 - smoothstep(0.002, 0.015, vWaterDepth);
float waveFoamPattern = sin(vUv.y * 120.0 - uTime * 4.0) * cos(vUv.x * 80.0);
float whitecapCrest = smoothstep(0.4, 0.8, waveFoamPattern) * smoothstep(0.005, 0.02, vWaterDepth);

float totalFoam = clamp(foamLine * 0.75 + whitecapCrest * 0.5, 0.0, 0.95);
vec3 finalColor = mix(waterBaseColor, foamColor, totalFoam) + specularHighlight;
```

---

## 5. 📁 File Inventory & Core Functions

| File Path | Description / Key Functions |
| :--- | :--- |
| [`src/engine/WaveGenerator.ts`](file:///Users/natasha/Antigravity/src/engine/WaveGenerator.ts) | `updateBoundary()`: Calculates 8s surge/ebb cycles, +0.02m tide ratchet, and row Y=0 boundary condition. |
| [`src/engine/PipedFlowSolver.ts`](file:///Users/natasha/Antigravity/src/engine/PipedFlowSolver.ts) | `step()`: Pipe flux solver, 0.5 outflow scaling factor, 2.0 m/s velocity clamp, Laplacian diffusion filter ($\nu=0.15$). |
| [`src/render/shaders/waterShader.ts`](file:///Users/natasha/Antigravity/src/render/shaders/waterShader.ts) | `waterVertexShader`: Displaces Z by $b + \max(0, h)$ and collapses $h < 0.002\text{m}$ onto sand bed. `waterFragmentShader`: Whitecap foam and specular sheen. |
| [`tasks/lessons.md`](file:///Users/natasha/Antigravity/tasks/lessons.md) | Permanent Lock Down Directive & Lessons Learned log. |

---

## 🔒 Verification & Immutable Directives

1. **DO NOT REMOVE THE LAPLACIAN DIFFUSION FILTER ($\nu = 0.15$)**: It is essential for spire-free numerical stability.
2. **DO NOT ALTER THE 8-SECOND WAVE CYCLE ($3.5\text{s surge} / 4.5\text{s ebb}$)**: This structure eliminates boundary over-drainage and firehose defects.
3. **DO NOT REMOVE THE $h < 0.002\text{m}$ VERTEX COLLAPSE**: It prevents floating water plane artifacts across dry sand.
