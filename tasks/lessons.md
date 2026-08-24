# Lessons & Golden Configuration Baseline

## 🌊 Water & Tide Hydrodynamic Baseline (DO NOT ALTER)

### Key Working Parameters (`PipedFlowSolver.ts`, `WaveGenerator.ts` & `waterShader.ts`):
1. **Paper-Thin Coastal Swash Sheet**: Max water depth capped at **$0.035\text{m}$ (3.5 cm max depth)** above sand terrain in shader vertex displacement and solver. Eliminates the vertical swimming pool block wall defect.
2. **Continuous Boundary Injection**: Row $Y=0$ maintains a continuous non-zero ocean water head ($h_{\text{min}} \ge 0.005\text{m}$) without zeroing out on wave lulls, allowing moats and basins to pool and deepen naturally.
3. **Incremental Wave Swash Packets**: 4-second wave cycle ($T_{\text{cycle}} = 4.0\text{s}$) advancing step-by-step up beach Y-grid ($16\text{ cells}$ higher reach per wave).
4. **Three-Tier Astronomical Tide Curve**: $\sin^2(t)$ base tide + superposed multi-frequency swells ($\sin 2.4t + \sin 4.1t$) and wave group sets.

### Peer Critique Lessons:
- **Flaw in Un-clamped $v = \sqrt{gh}$**: Un-clamped water depth injection at $Y=0$ creates giant vertical blue spires and swimming pool block walls in 3D WebGL space.
- **Flaw in `water = 0` Boundary Rule**: Zeroing out boundary cells during wave lulls forces accumulated water in moats to drain backwards out of the grid, destroying lake pooling.
