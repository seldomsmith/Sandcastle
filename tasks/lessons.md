# Lessons & Golden Baseline Configuration

## 🏆 GOLDEN BASELINE: Periodic Surge-and-Ebb Wave Engine (Commit `6a35232`)

**DO NOT ALTER OR MODIFY THESE CORE WAVE ENGINE EQUATIONS AND SHADER DISPLACEMENT RULES.**

---

### Key Locked Parameters:

#### 1. Discrete Periodic Wave Cycle Engine (`WaveGenerator.ts`):
- **8.0-Second Wave Period ($T = 8.0\text{s}$)**:
  - **Surge Phase ($0.0\text{s} \to 3.5\text{s}$)**: Injects shallow wave pulse ($h = 0.02\text{m}\text{--}0.04\text{m}$) with forward kinetic velocity ($v_y = +1.2\text{ m/s}$) surging up the beach.
  - **Ebb Phase ($3.5\text{s} \to 8.0\text{s}$)**: Shuts off injection completely at $Y=0$, setting velocity to allow receding backwash to drain naturally seaward.
- **Macro Base Tide Ratchet**:
  - Every completed $8\text{s}$ cycle, ratchets base mean sea level by $+0.02\text{m}$. Each successive wave starts its run-up higher up the beach face.

#### 2. Numerical Flux Clamping & Laplacian Diffusion (`PipedFlowSolver.ts`):
- **Outflow Safety Factor**: Capped total cell outflow volume $\sum F_{\text{out}} \cdot \Delta t \le h_{\text{cell}} \cdot \text{Area} \cdot 0.5$.
- **Velocity Clamping**: Capped horizontal velocities $\max(|u|, |v|) \le 2.0\text{ m/s}$.
- **Laplacian Viscosity Filter ($\nu = 0.15$)**: Applied 4-neighbour spatial depth smoothing every tick to instantly damp high-frequency numerical spires:
  $$h_{i,j}^{\text{new}} = h_{i,j} + \nu \cdot \left(\frac{h_{i-1,j} + h_{i+1,j} + h_{i,j-1} + h_{i,j+1}}{4} - h_{i,j}\right)$$

#### 3. Water Vertex Shader Normalization (`waterShader.ts`):
- Collapses vertices with `waterDepth < 0.002m` directly onto the terrain bed ($z = b$) to eliminate floating blue planes.
- Displaces position strictly along surface height: `displacedPos.z = b + max(0.0, h)`.

---

## 📊 Comparative Analysis: Current Golden Baseline (`6a35232`) vs. Earlier Version (`d8214a1`)

| Parameter / Dynamic | Earlier Version (`d8214a1`) | Current Golden Baseline (`6a35232`) | Superiority & Why |
| :--- | :--- | :--- | :--- |
| **Numerical Stability** | Prone to occasional flux oscillation spires when depth built up. | **100% Spire-Free**: Laplacian spatial diffusion filter ($\nu = 0.15$) + 0.5 outflow scaling factor. | 🏆 **Current (`6a35232`)**: Zero spires or visual mesh blowout artifacts. |
| **Water Mesh Displacement** | Clamped depth to 0.12m, creating artificial visual depth ceilings. | **Vertex Collapse Threshold ($h < 0.002\text{m}$)**: Collapses onto bed, displaced strictly by $z = b + h$. | 🏆 **Current (`6a35232`)**: Completely eliminates floating blue planes and detached mesh artifacts. |
| **Wave Structure** | Step-by-step swash reach horizon algorithm. | **Periodic Surge (3.5s) & Ebb (4.5s)** with **+0.02m Macro Base Tide Ratchet**. | 🏆 **Current (`6a35232`)**: Organic periodic wave pulses that run up, recede down, and ratchet higher every wave. |
| **Boundary Injection** | Continuous water injection at $Y=0$. | Shut-off at $Y=0$ during Ebb phase ($3.5\text{s}-8.0\text{s}$). | 🏆 **Current (`6a35232`)**: Eliminates the "broken firehose" defect, allowing natural seaward backwash drainage. |
