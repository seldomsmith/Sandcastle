# Lessons & Golden Configuration Baseline

## 🌊 Water & Tide Hydrodynamic Baseline (DO NOT ALTER)

### Key Working Parameters (`PipedFlowSolver.ts` & `waterShader.ts`):
1. **Depth Clamping**: Max water depth capped at **$0.12\text{m}$ (12 cm)** above sand terrain in both shader vertex displacement and solver. Prevents vertical spires while permitting deep moat pooling.
2. **Incremental Wave Swash Packets**: 4-second wave cycle ($T_{\text{cycle}} = 4.0\text{s}$) advancing step-by-step up beach Y-grid ($16\text{ cells}$ higher reach per wave).
3. **Continuous Fluid Sheet Flow**: Smooth pipe factor ($0.15$) allowing swash water to naturally fill depressions, moats, and basins without artificial dry gaps.
4. **Ocean Drainage Boundary**: Receding backwash phase drains $30\%$ of water volume seaward at $Y=0$ on each cycle.

### Rule for Future Updates:
- Never re-introduce artificial dry gap zeroing horizon masks.
- Keep vertex depth displacement clamped to $0.12\text{m}$ max.
