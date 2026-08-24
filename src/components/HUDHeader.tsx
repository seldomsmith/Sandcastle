/**
 * Sandcastle vs. Tide Simulator - HUD Telemetry Header
 *
 * Top floating bar displaying Keep Integrity, Tide status, simulation frame counter,
 * performance metrics, play/pause controls, stress heatmap toggle, and castle sharing.
 */

import React from 'react';

interface HUDHeaderProps {
  isTideActive: boolean;
  frameCount: number;
  lastTickMs: number;
  isSharedMemory: boolean;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
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
  onToggleHeatmap,
  onShare,
  onStartTide,
  onPauseTide,
  onReset
}) => {
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
      {/* Telemetry Status Gauges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '11px',
          color: '#cbd5e1',
          pointerEvents: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
          <span style={{ color: '#94a3b8' }}>ENGINE:</span>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>60 Hz</span>
        </div>

        <div style={{ height: '12px', width: '1px', backgroundColor: '#334155' }} />

        <div>
          <span style={{ color: '#94a3b8' }}>TICK:</span>{' '}
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>{lastTickMs.toFixed(1)}ms</span>
        </div>

        <div style={{ height: '12px', width: '1px', backgroundColor: '#334155' }} />

        <div>
          <span style={{ color: '#94a3b8' }}>FRAME:</span>{' '}
          <span style={{ fontWeight: 700, color: '#ffffff' }}>{frameCount}</span>
        </div>

        <div style={{ height: '12px', width: '1px', backgroundColor: '#334155' }} />

        <div>
          <span style={{ color: '#94a3b8' }}>MEMORY:</span>{' '}
          <span style={{ fontWeight: 700, color: isSharedMemory ? '#34d399' : '#fbbf24' }}>
            {isSharedMemory ? 'Zero-Copy SAB' : 'ArrayBuffer'}
          </span>
        </div>
      </div>

      {/* Tide Controls, Heatmap & Share Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '8px 16px',
          borderRadius: '12px',
          pointerEvents: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}
      >
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
          {showHeatmap ? '🔥 Stress Heatmap ON' : '🌡️ Heatmap OFF'}
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

        <div style={{ height: '12px', width: '1px', backgroundColor: '#334155', margin: '0 4px' }} />

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
