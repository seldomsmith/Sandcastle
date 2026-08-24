# Lessons & Golden Baseline Configuration

## 🔒 PERMANENT LOCK DOWN DIRECTIVE: Periodic Surge-and-Ebb Wave Engine (Commit `6a35232` / `7d09b5b`)

**STRICT DIRECTIVE: DO NOT TOUCH OR ALTER THE WAVE / TIDE ENGINE CODE OR WATER SHADERS UNDER ANY CIRCUMSTANCES.**

---

### Locked Files (Immutable Core):
- `src/engine/WaveGenerator.ts`
- `src/engine/PipedFlowSolver.ts`
- `src/render/shaders/waterShader.ts`

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
