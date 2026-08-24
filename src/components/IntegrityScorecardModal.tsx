/**
 * Sandcastle vs. Tide Simulator - Warm Technical Neo-Brutalist Live Integrity Scorecard Modal
 *
 * Interactive telemetry scorecard pop-out displaying live non-linear SVG graphs:
 * 1. Wave Hydrodynamic Energy Impact Spikes (J/s) [Rhythmic wave surge spikes]
 * 2. Base Liquefaction Saturation Rate (%) [Sigmoidal S-Curve]
 * 3. Sand Mass Retention Step-Curve (m³) [Step-wise structural wall collapse]
 *
 * Designed in Warm Technical Neo-Brutalist style (#F3F0E6 background, 1px solid #111111 borders, 0px corners, X close button).
 */

import React from 'react';

export interface TelemetryPoint {
  timeSec: number;
  keepHealth: number;
  waveEnergy: number;      // Wave impact energy (J/s)
  saturationPercent: number; // Base saturation (%)
  sandMassM3: number;        // Sand mass volume (m³)
}

interface IntegrityScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetryHistory: TelemetryPoint[];
  currentKeepHealth: number;
}

export const IntegrityScorecardModal: React.FC<IntegrityScorecardModalProps> = ({
  isOpen,
  onClose,
  telemetryHistory,
  currentKeepHealth
}) => {
  if (!isOpen) return null;

  const points = telemetryHistory.slice(-50); // Last 50 telemetry ticks
  const chartWidth = 360;
  const chartHeight = 70;

  // Helper to generate SVG polyline points string
  const generatePolyline = (getValue: (pt: TelemetryPoint) => number, minVal: number, maxVal: number) => {
    if (points.length < 2) return '';
    const range = Math.max(1e-4, maxVal - minVal);
    return points
      .map((pt, i) => {
        const x = (i / (points.length - 1)) * chartWidth;
        const normY = (getValue(pt) - minVal) / range;
        const y = chartHeight - normY * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const latestPt = points[points.length - 1] || {
    waveEnergy: 0,
    saturationPercent: 10,
    sandMassM3: 0.45
  };

  const wavePolyline = generatePolyline((p) => p.waveEnergy, 0, 80);
  const satPolyline = generatePolyline((p) => p.saturationPercent, 0, 100);
  const massPolyline = generatePolyline((p) => p.sandMassM3, 0.1, 0.5);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        backgroundColor: 'rgba(17, 17, 17, 0.5)',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#F3F0E6',
          border: '1px solid #111111',
          borderRadius: '0px',
          padding: '20px',
          width: '420px',
          color: '#111111',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          position: 'relative'
        }}
      >
        {/* X Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '24px',
            height: '24px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '12px',
            border: 'none',
            borderRadius: '0px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}
        >
          X
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#666660', letterSpacing: '0.08em' }}>
            TELEMETRY SCORECARD REPORT
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
            KEEP INTEGRITY METRICS
          </h2>
        </div>

        <div style={{ height: '1px', backgroundColor: '#111111' }} />

        {/* Graph 1: Hydrodynamic Wave Impact Spikes (J/s) */}
        <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#666660', marginBottom: '6px' }}>
            <span>WAVE HYDRODYNAMIC IMPACT (J/S)</span>
            <span style={{ color: '#111111', fontWeight: 800 }}>{Math.round(latestPt.waveEnergy)} J/s</span>
          </div>
          <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', width: '100%' }}>
            {/* Background Gridlines */}
            <line x1="0" y1="35" x2={chartWidth} y2="35" stroke="#DCD7C9" strokeWidth="1" strokeDasharray="3 3" />
            {wavePolyline && <polyline fill="none" stroke="#111111" strokeWidth="2.5" points={wavePolyline} />}
          </svg>
        </div>

        {/* Graph 2: Base Liquefaction Saturation Rate S-Curve (%) */}
        <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#666660', marginBottom: '6px' }}>
            <span>BASE SATURATION S-CURVE (%)</span>
            <span style={{ color: '#111111', fontWeight: 800 }}>{Math.round(latestPt.saturationPercent)}%</span>
          </div>
          <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', width: '100%' }}>
            <line x1="0" y1="35" x2={chartWidth} y2="35" stroke="#DCD7C9" strokeWidth="1" strokeDasharray="3 3" />
            {satPolyline && <polyline fill="none" stroke="#111111" strokeWidth="2.5" points={satPolyline} />}
          </svg>
        </div>

        {/* Graph 3: Sand Mass Volume Retention Step-Curve (m³) */}
        <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#666660', marginBottom: '6px' }}>
            <span>SAND MASS VOLUME RETENTION (M³)</span>
            <span style={{ color: '#111111', fontWeight: 800 }}>{Math.round(latestPt.sandMassM3 * 100) / 100} m³</span>
          </div>
          <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', width: '100%' }}>
            <line x1="0" y1="35" x2={chartWidth} y2="35" stroke="#DCD7C9" strokeWidth="1" strokeDasharray="3 3" />
            {massPolyline && <polyline fill="none" stroke="#111111" strokeWidth="2.5" points={massPolyline} />}
          </svg>
        </div>

        {/* Return to Simulation Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '11px',
            borderRadius: '0px',
            border: '1px solid #111111',
            cursor: 'pointer',
            letterSpacing: '0.05em'
          }}
        >
          CLOSE SCORECARD & RETURN TO SIMULATION
        </button>
      </div>
    </div>
  );
};
