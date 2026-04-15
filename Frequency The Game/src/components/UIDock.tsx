import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { togglePlay, setSpeed } from '../store/timeSlice';
import { setToolMode } from '../store/toolSlice';
import { repairFleet, setFare, buyServiceHours } from '../store/agencySlice';
import FloatingMenu from './FloatingMenu';
import RouteManagementMenu from './RouteManagementMenu';
import './UIDock.css';

type MenuKey = 'map' | 'routes' | 'fleet' | 'progression' | null;

interface UIDockProps {
  heatmapVisible: boolean;
  coverageVisible: boolean;
  setHeatmapVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setCoverageVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIDock: React.FC<UIDockProps> = ({ heatmapVisible, coverageVisible, setHeatmapVisible, setCoverageVisible }) => {
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  const { isPlaying, speedMultiplier, gameTimestamp } = useSelector((state: RootState) => state.time);
  const toolMode = useSelector((state: RootState) => state.tool.mode);
  const grid = useSelector((state: RootState) => state.grid);
  const routes = useSelector((state: RootState) => state.route.routes);
  const stops = useSelector((state: RootState) => state.infrastructure.stops);
  const agency = useSelector((state: RootState) => state.agency);

  const totalPopulation = grid.cells.reduce((acc, cell) => acc + cell.population, 0);
  const currentHourRidership = routes.reduce((acc, r) => acc + r.serviceLoad, 0);
  const ridershipPct = totalPopulation > 0
    ? ((currentHourRidership / totalPopulation) * 100).toFixed(1)
    : '0.0';
  const availableHours = agency.budgetHours - agency.usedHours;

  // Format game time
  const totalMinutes = gameTimestamp;
  const days = Math.floor(totalMinutes / 1440) + 1;
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const timeString = `Day ${days}  ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const toggleMenu = (key: MenuKey) => setOpenMenu(prev => prev === key ? null : key);
  const inDanger = parseFloat(ridershipPct) < 10 && totalPopulation > 0 && isPlaying;

  const overlaySummary = [
    heatmapVisible ? 'Heatmap' : null,
    coverageVisible ? 'Coverage' : null,
  ].filter(Boolean).join(', ') || 'None';

  return (
    <>
      {/* Map Options Panel */}
      <FloatingMenu
        title="Map Overlays"
        isOpen={openMenu === 'map'}
        onClose={() => setOpenMenu(null)}
        defaultPosition={{ x: window.innerWidth / 2 - 150, y: window.innerHeight - 400 }}
      >
        <div className="menu-section">
          <div className="overlay-status">
            <span>Active overlays:</span>
            <strong>{heatmapVisible ? 'Heatmap' : 'Heatmap off'}</strong>
            <strong>{coverageVisible ? 'Coverage' : 'Coverage off'}</strong>
          </div>
          <div className="toggle-row">
            <span>Heatmap: demand intensity</span>
            <button
              className={`toggle-btn ${heatmapVisible ? 'on' : ''}`}
              onClick={() => setHeatmapVisible(v => !v)}
              title="Toggle the demographic heatmap overlay"
            >
              {heatmapVisible ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="toggle-row">
            <span>Coverage: service catchment</span>
            <button
              className={`toggle-btn ${coverageVisible ? 'on' : ''}`}
              onClick={() => setCoverageVisible(v => !v)}
              title="Toggle the service coverage overlay"
            >
              {coverageVisible ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <div className="menu-legend">
          <div className="legend-item"><span className="swatch" style={{ background: '#FF0000' }} />Commuter demand</div>
          <div className="legend-item"><span className="swatch" style={{ background: '#0000FF' }} />All-purpose demand</div>
          <div className="legend-item"><span className="swatch" style={{ background: '#7F007F' }} />Balanced demand</div>
        </div>
        <div className="menu-hint">
          Darker fills show greater density. Use coverage to see service reach.
        </div>
      </FloatingMenu>

      {/* Route Management Panel */}
      <FloatingMenu
        title={`Route Management  (${routes.length})`}
        isOpen={openMenu === 'routes'}
        onClose={() => setOpenMenu(null)}
        defaultPosition={{ x: 20, y: window.innerHeight - 550 }}
      >
        <RouteManagementMenu />
      </FloatingMenu>

      {/* Fleet & Finance Panel */}
      <FloatingMenu
        title="Fleet & Finance"
        isOpen={openMenu === 'fleet'}
        onClose={() => setOpenMenu(null)}
        defaultPosition={{ x: window.innerWidth - 330, y: window.innerHeight - 500 }}
      >
        <div className="menu-section">
          <div className="section-title">Treasury & Pricing</div>
          <div className="kpi-row highlight">
            <span>Balance</span><strong>${Math.round(agency.treasury).toLocaleString()}</strong>
          </div>
          <div className="kpi-row">
            <span>Fare Price</span><strong>${agency.farePrice.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.05"
            value={agency.farePrice}
            onChange={(e) => dispatch(setFare(parseFloat(e.target.value)))}
            className="menu-slider"
          />
          <div className="kpi-row">
            <span>Daily Revenue</span><strong>${Math.round(agency.dailyRevenue).toLocaleString()}</strong>
          </div>
          <div className="kpi-row">
            <span>Total Riders</span><strong>{agency.totalRidership.toLocaleString()}</strong>
          </div>
        </div>

        <div className="menu-section">
          <div className="section-title">Service Capacity</div>
          <div className="kpi-row">
            <span>Budget</span><strong>{agency.budgetHours.toLocaleString()} hr</strong>
          </div>
          <div className="kpi-row highlight">
            <span>Available</span><strong>{availableHours.toLocaleString()} hr</strong>
          </div>
          <div className="menu-hint">$500 per additional service hour.</div>
          <button
            className="action-btn"
            onClick={() => dispatch(buyServiceHours(24))}
            disabled={agency.treasury < 12000}
          >
            Buy +24 Hours ($12,000)
          </button>
        </div>

        <div className="menu-section">
          <div className="section-title">Fleet Quality</div>
          <div className="quality-bar-wrap">
            <div
              className="quality-bar"
              style={{
                width: `${Math.round(agency.fleetQuality)}%`,
                background: agency.fleetQuality > 70 ? '#00ff88' : agency.fleetQuality > 40 ? '#ffaa00' : '#ff4444'
              }}
            />
          </div>
          <div className="kpi-row">
            <span>Quality</span><strong>{Math.round(agency.fleetQuality)}%</strong>
          </div>
          <div className="menu-hint">$150 per 1% restored. Degrades with active service.</div>
          <button
            className="action-btn"
            onClick={() => dispatch(repairFleet(100))}
            disabled={agency.fleetQuality >= 99.5 || agency.treasury < Math.ceil(100 - agency.fleetQuality) * 150}
          >
            Repair to 100% ({Math.ceil(100 - agency.fleetQuality) > 0 ? `$${(Math.ceil(100 - agency.fleetQuality) * 150).toLocaleString()}` : 'Full'})
          </button>
        </div>
      </FloatingMenu>

      {/* Progression Panel */}
      <FloatingMenu
        title="Progression & Milestones"
        isOpen={openMenu === 'progression'}
        onClose={() => setOpenMenu(null)}
        defaultPosition={{ x: window.innerWidth / 2 - 150, y: 50 }}
      >
        <div className="achievement-list">
          <div className="achievement-item">
            <div className="ach-text">
              <strong>First Route</strong>
              <span>Draw your first transit line</span>
            </div>
            <div className={`ach-status ${routes.length > 0 ? 'done' : ''}`}>
              {routes.length > 0 ? 'Done' : '--'}
            </div>
          </div>
          <div className="achievement-item">
            <div className="ach-text">
              <strong>First Stop</strong>
              <span>Place your first bus stop</span>
            </div>
            <div className={`ach-status ${stops.length > 0 ? 'done' : ''}`}>
              {stops.length > 0 ? 'Done' : '--'}
            </div>
          </div>
          <div className="achievement-item">
            <div className="ach-text">
              <strong>1,000 Riders</strong>
              <span>Accumulate 1,000 total trips</span>
            </div>
            <div className={`ach-status ${agency.totalRidership >= 1000 ? 'done' : ''}`}>
              {agency.totalRidership >= 1000 ? 'Done' : `${agency.totalRidership}/1000`}
            </div>
          </div>
          <div className="achievement-item">
            <div className="ach-text">
              <strong>Coverage 30%</strong>
              <span>Serve 30% of total population per hour</span>
            </div>
            <div className={`ach-status ${parseFloat(ridershipPct) >= 30 ? 'done' : ''}`}>
              {parseFloat(ridershipPct) >= 30 ? 'Done' : `${ridershipPct}%`}
            </div>
          </div>
          <div className="achievement-item">
            <div className="ach-text">
              <strong>10 Routes</strong>
              <span>Manage 10 simultaneous bus routes</span>
            </div>
            <div className={`ach-status ${routes.length >= 10 ? 'done' : ''}`}>
              {routes.length >= 10 ? 'Done' : `${routes.length}/10`}
            </div>
          </div>
        </div>
      </FloatingMenu>

      {/* Tool Selector */}
      <div className="toolbox">
        <button
          className={`tool-btn ${toolMode === 'select' ? 'active' : ''}`}
          onClick={() => dispatch(setToolMode('select'))}
          title="Navigate (pan & zoom)"
        >
          Navigate
        </button>
        <div className="tool-divider" />
        <button
          className={`tool-btn ${toolMode === 'drawRoute' ? 'active drawing' : ''}`}
          onClick={() => dispatch(setToolMode(toolMode === 'drawRoute' ? 'select' : 'drawRoute'))}
          title="Draw Route: click and drag on the grid"
        >
          Draw Route
        </button>
        <button
          className={`tool-btn ${toolMode === 'placeStop' ? 'active placing' : ''}`}
          onClick={() => dispatch(setToolMode(toolMode === 'placeStop' ? 'select' : 'placeStop'))}
          title="Place Bus Stop: click on a grid vertex"
        >
          Place Stop
        </button>
      </div>

      {/* Permanent Bottom Dock */}
      <div className="ui-dock">
        {/* KPI Strip — two-row layout: labels on top, values below, all aligned */}
        <div className="kpi-strip">
          <div className={`kpi-cell ${inDanger ? 'danger' : ''}`}>
            <div className="kpi-label">Riders/hr</div>
            <div className="kpi-value">{currentHourRidership.toLocaleString()}</div>
          </div>
          <div className={`kpi-cell ${inDanger ? 'danger' : ''}`}>
            <div className="kpi-label">of Pop.</div>
            <div className="kpi-value">{ridershipPct}%</div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">Svc Hours</div>
            <div className="kpi-value">{availableHours.toLocaleString()}</div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">Fleet</div>
            <div className="kpi-value">{Math.round(agency.fleetQuality)}%</div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">Treasury</div>
            <div className="kpi-value treasury-val">${Math.round(agency.treasury).toLocaleString()}</div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">Population</div>
            <div className="kpi-value">{totalPopulation.toLocaleString()}</div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="dock-separator" />

        {/* Time & Controls */}
        <div className="controls-group">
          <div className="time-display">{timeString}</div>
          <div className="time-controls-row">
            <button
              className={`play-button ${isPlaying ? 'active' : ''}`}
              onClick={() => dispatch(togglePlay())}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <div className="speed-buttons">
              {[1, 2, 5, 10].map(s => (
                <button
                  key={s}
                  className={speedMultiplier === s ? 'active' : ''}
                  onClick={() => dispatch(setSpeed(s))}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="dock-separator" />

        {/* Menu Buttons */}
        <div className="menu-buttons">
          <button
            className={`menu-btn ${openMenu === 'map' ? 'active' : ''}`}
            onClick={() => toggleMenu('map')}
            title={`Active overlays: ${overlaySummary}`}
          >
            Map{overlaySummary !== 'None' ? ` (${overlaySummary})` : ''}
          </button>
          <button
            className={`menu-btn ${openMenu === 'routes' ? 'active' : ''}`}
            onClick={() => toggleMenu('routes')}
          >
            Routes{routes.length > 0 && <span className="badge">{routes.length}</span>}
          </button>
          <button
            className={`menu-btn ${openMenu === 'fleet' ? 'active' : ''}`}
            onClick={() => toggleMenu('fleet')}
          >
            Fleet
          </button>
          <button
            className={`menu-btn ${openMenu === 'progression' ? 'active' : ''}`}
            onClick={() => toggleMenu('progression')}
          >
            Goals
          </button>
        </div>
      </div>

      {/* Play prompt overlay */}
      {!isPlaying && (
        <div className="play-prompt">
          Select <strong>Draw Route</strong> or <strong>Place Stop</strong> from the toolbar, then press <strong>PLAY</strong> to simulate
        </div>
      )}

      {/* Danger warning banner */}
      {inDanger && (
        <div className="danger-warning">
          Ridership below 10% threshold — service collapse imminent
        </div>
      )}
    </>
  );
};

export default UIDock;
