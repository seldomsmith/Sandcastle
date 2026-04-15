import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { removeRoute, updateRouteFrequency, updateRouteColor, renameRoute, toggleRouteVisibility, ROUTE_COLORS } from '../store/routeSlice';
import { setEditingRoute } from '../store/toolSlice';
import FrequencyGraph from './FrequencyGraph';
import './RouteManagementMenu.css';

const RouteManagementMenu: React.FC = () => {
  const dispatch = useDispatch();
  const routes = useSelector((state: RootState) => state.route.routes);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null);

  if (routes.length === 0) {
    return (
      <div className="route-list-empty">
        <p>No routes yet.</p>
        <p className="hint">Left-click and drag on the grid to draw a route.</p>
      </div>
    );
  }

  return (
    <div className="route-list">
      {routes.map((route) => {
        const isExpanded = expandedRouteId === route.id;
        const totalFreq = route.weeklyFrequency.slice(0, 24).reduce((a, b) => a + b, 0);
        const routeSegments = Math.max(0, route.points.length - 1);
        const routeDurationMinutes = routeSegments * 6 * 2 + route.points.length * 1;
        const estimatedHours = Math.round((routeDurationMinutes / 60) * totalFreq);

        return (
          <div key={route.id} className={`route-item ${isExpanded ? 'expanded' : ''}`}>
            {/* Route Header Row */}
            <div className="route-header" onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}>
              <span className="route-color-dot" style={{ background: route.color }} />
              {editingName?.id === route.id ? (
                <input
                  className="route-name-input"
                  value={editingName.value}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditingName({ ...editingName, value: e.target.value })}
                  onBlur={() => {
                    dispatch(renameRoute({ routeId: route.id, name: editingName.value }));
                    setEditingName(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      dispatch(renameRoute({ routeId: route.id, name: editingName.value }));
                      setEditingName(null);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span className="route-name" onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingName({ id: route.id, value: route.name });
                }}>
                  {route.name}
                </span>
              )}
              <span className="route-load">{route.serviceLoad} riders</span>
              <button
                className={`visibility-btn ${route.visible ? '' : 'hidden-route'}`}
                onClick={(e) => { e.stopPropagation(); dispatch(toggleRouteVisibility(route.id)); }}
                title={route.visible ? 'Hide route' : 'Show route'}
              >
                {route.visible ? 'Visible' : 'Hidden'}
              </button>
              <span className="route-chevron">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Expanded Detail Panel */}
            {isExpanded && (
              <div className="route-detail">
                {/* Color Picker */}
                <div className="section-label">Colour</div>
                <div className="color-palette">
                  {ROUTE_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-swatch ${route.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => dispatch(updateRouteColor({ routeId: route.id, color: c }))}
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="route-stats">
                  <div className="stat"><span>Stops</span><strong>{route.points.filter((_, i) => i % 3 === 0).length}</strong></div>
                  <div className="stat"><span>Est. Hours</span><strong>{estimatedHours}h</strong></div>
                  <div className="stat"><span>Load</span><strong>{route.serviceLoad}</strong></div>
                </div>

                {/* Frequency graph */}
                <div className="section-label">Daily Frequency <span className="hint-small">(drag to adjust)</span></div>
                <FrequencyGraph
                  routeId={route.id}
                  frequencies={route.weeklyFrequency.slice(0, 24)}
                  onChange={(newFreqs) => {
                    const updated = [...route.weeklyFrequency];
                    for (let i = 0; i < 24; i++) updated[i] = newFreqs[i];
                    dispatch(updateRouteFrequency({ routeId: route.id, frequencies: updated }));
                  }}
                />

                {/* Edit + Delete */}
                <div className="route-actions">
                  <button
                    className="edit-route-btn"
                    onClick={() => dispatch(setEditingRoute(route.id))}
                  >
                    Edit Route
                  </button>
                  <button
                    className="delete-route-btn"
                    onClick={() => {
                      dispatch(removeRoute(route.id));
                      setExpandedRouteId(null);
                    }}
                  >
                    Delete Route
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RouteManagementMenu;
