import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import './App.css'
import ViewportCanvas from './render/ViewportCanvas'
import UIDock from './components/UIDock'
import { useSimulationTicker } from './engine/useSimulationTicker'
import { useBudgetManager } from './engine/useBudgetManager'
import { useSimulationLogic } from './engine/useSimulationLogic'
import { initializeCityCore } from './engine/cityInit'
import { initializeGrid } from './store/gridSlice'
import { store } from './store'

function App() {
  const dispatch = useDispatch();
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [coverageVisible, setCoverageVisible] = useState(false);
  
  useSimulationTicker();
  useBudgetManager();
  useSimulationLogic();

  useEffect(() => {
    // Read directly from store to avoid stale closure
    const currentCells = store.getState().grid.cells;
    const initializedCells = initializeCityCore(currentCells);
    dispatch(initializeGrid(initializedCells));
  }, []); // Run once on mount

  useEffect(() => {
    setHeatmapVisible(true);
    setCoverageVisible(false);
  }, []);

  return (
    <div className="app-container">
      <ViewportCanvas heatmapVisible={heatmapVisible} coverageVisible={coverageVisible} />
      <UIDock
        heatmapVisible={heatmapVisible}
        coverageVisible={coverageVisible}
        setHeatmapVisible={setHeatmapVisible}
        setCoverageVisible={setCoverageVisible}
      />
    </div>
  )
}

export default App
