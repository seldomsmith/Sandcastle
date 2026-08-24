/**
 * Sandcastle vs. Tide Simulator - HUD Telemetry Header
 *
 * Top floating bar displaying Keep Integrity Gauge, Scenario Presets Selector,
 * performance metrics, play/pause controls, tide speed toggles, stress heatmap, contour isolines, and castle sharing.
 */

import React from 'react';
import { COASTAL_SCENARIOS } from '../config/scenarios';
import { WorkerBridge } from '../bridge/WorkerBridge';

interface HUDHeaderProps {
  isTideActive: boolean;
  frameCount: number;
  lastTickMs: number;
  isSharedMemory: boolean;
  showHeatmap: boolean;
  showContours: boolean;
  speedMultiplier: number;
  keepHealthPercent: number;
  onChangeSpeed: (speed: number) => void;
  onToggleHeatmap: () => void;
  onToggleContours: () => void;
  onShare: () => void;
  onStartTide: () => void;
  onPauseTide: () => void;
  onReset: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  isTideActive,
  frameCount,
  lastTickMs,
  isSharedMemory,
  showHeatmap,
  showContours,
  speedMultiplier,
  keepHealthPercent,
  onChangeSpeed,
  onToggleHeatmap,
  onToggleContours,
  onShare,
  onStartTide,
  onPauseTide,
  onReset
}) => {
  const speeds = [0.5, 1, 2, 5, 10, 25];

  const handleScenarioChange = (scenarioId: string) => {
    const preset = COASTAL_SCENARIOS.find((s) => s.id === scenarioId);
    if (preset) {
      WorkerBridge.getInstance().updateScenario(preset.config);
      alert(`Switched coastal environment scenario to: ${preset.name}`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Keep Integrity Gauge & Telemetry Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '10px 18px',
          borderRadius: '14px',
          fontSize: '12px',
          color: '#cbd5e1',
          pointerEvents: 'auto',
          boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Prominent Keep Health Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>🏰</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ color: '#94a3b8' }}>KEEP INTEGRITY:</span>
              <span style={{ color: keepHealthPercent > 50 ? '#34d399' : '#f43f5e', marginLeft: '6px' }}>
                {Math.round(keepHealthPercent)}%
              </span>
            </div>
            {/* Visual Health Progress Bar */}
            <div style={{ width: '110px', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, keepHealthPercent))}%`,
                  height: '100%',
                  backgroundColor: keepHealthPercent > 50 ? '#34d399' : '#f43f5e',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ height: '24px', width: '1px', backgroundColor: '#334155' }} />

        {/* Coastal Scenario Presets Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>SCENARIO:</span>
          <select
            onChange={(e) => handleScenarioChange(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '4px 8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {COASTAL_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: '24px', width: '1px', backgroundColor: '#334155' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
          <span style={{ color: '#94a3b8' }}>60 Hz</span>
        </div>

        <div>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>TICK:</span>{' '}
          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '11px' }}>{lastTickMs.toFixed(1)}ms</span>
        </div>
      </div>

      {/* Tide Controls, Speed Selector, Heatmap, Contours & Share Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '10px 18px',
          borderRadius: '14px',
          pointerEvents: 'auto',
          boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Speed Selector Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '4px' }}>Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                border: speedMultiplier === s ? '1px solid #38bdf8' : '1px solid #334155',
                backgroundColor: speedMultiplier === s ? '#0284c7' : '#1e293b',
                color: speedMultiplier === s ? '#ffffff' : '#cbd5e1',
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        <div style={{ height: '16px', width: '1px', backgroundColor: '#334155', margin: '0 4px' }} />

        {/* Topographic Contours Toggle */}
        <button
          onClick={onToggleContours}
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '8px',
            cursor: 'pointer',
            border: showContours ? '1px solid #38bdf8' : '1px solid #334155',
            backgroundColor: showContours ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
            color: showContours ? '#38bdf8' : '#cbd5e1'
          }}
        >
          {showContours ? '📐 Contours ON' : '📐 Contours OFF'}
        </button>

        {/* Stress Heatmap Toggle */}
        <button
          onClick={onToggleHeatmap}
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '8px',
            cursor: 'pointer',
            border: showHeatmap ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid #334155',
            backgroundColor: showHeatmap ? 'rgba(244, 63, 94, 0.2)' : '#1e293b',
            color: showHeatmap ? '#fda4af' : '#cbd5e1'
          }}
        >
          {showHeatmap ? '🔥 Heatmap ON' : '🌡️ Heatmap OFF'}
        </button>

        <button
          onClick={onShare}
          style={{
            padding: '6px 12px',
            backgroundColor: '#1e293b',
            color: '#7dd3fc',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '8px',
            border: '1px solid #334155',
            cursor: 'pointer'
          }}
        >
          🔗 Share Castle
        </button>

        <div style={{ height: '16px', width: '1px', backgroundColor: '#334155', margin: '0 4px' }} />

        {isTideActive ? (
          <button
            onClick={onPauseTide}
            style={{
              padding: '6px 14px',
              backgroundColor: '#f59e0b',
              color: '#020617',
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Pause Tide
          </button>
        ) : (
          <button
            onClick={onStartTide}
            style={{
              padding: '6px 14px',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Start Tide Surge
          </button>
        )}

        <button
          onClick={onReset}
          style={{
            padding: '6px 14px',
            backgroundColor: '#1e293b',
            color: '#cbd5e1',
            fontWeight: 600,
            fontSize: '11px',
            borderRadius: '8px',
            border: '1px solid #334155',
            cursor: 'pointer'
          }}
        >
          Reset Map
        </button>
      </div>
    </div>
  );
};
