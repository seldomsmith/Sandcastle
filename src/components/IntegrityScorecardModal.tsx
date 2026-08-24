/**
 * Sandcastle vs. Tide Simulator - Expanded Integrity Telemetry & Autopsy Scorecard Modal
 *
 * Expands scorecard pop-out to a large 760px wide 2-column layout combining:
 * 1. Left Column: Prior Autopsy Metrics (Survival Time, Energy Dissipated, Sand Mass Eroded, Final Integrity, Primary Failure Cause)
 * 2. Right Column: 3 Live Non-Linear SVG Telemetry Graphs (Wave Energy Impact Spikes, Saturation S-Curve, Sand Mass Retention Step-Curve)
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
  survivalTimeSec?: number;
  failureCause?: string;
}

export const IntegrityScorecardModal: React.FC<IntegrityScorecardModalProps> = ({
  isOpen,
  onClose,
  telemetryHistory,
  currentKeepHealth,
  survivalTimeSec = 0,
  failureCause = "Toe Scour & Hydraulic Liquefaction of Castle Base"
}) => {
  if (!isOpen) return null;

  const points = telemetryHistory.slice(-50); // Last 50 telemetry ticks
  const chartWidth = 330;
  const chartHeight = 65;

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
    timeSec: survivalTimeSec,
    waveEnergy: 0,
    saturationPercent: 10,
    sandMassM3: 0.45
  };

  const activeSurvivalTime = Math.max(survivalTimeSec, latestPt.timeSec);
  const energyDissipatedJoules = Math.round(activeSurvivalTime * 14.5 * 10) / 10;
  const sandVolumeLostM3 = Math.round((1.0 - currentKeepHealth / 100) * 0.42 * 100) / 100;

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
        backgroundColor: 'rgba(17, 17, 17, 0.65)',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#F3F0E6',
          border: '1px solid #111111',
          borderRadius: '0px',
          padding: '24px',
          width: '760px',
          maxWidth: '92vw',
          color: '#111111',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative'
        }}
      >
        {/* X Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '14px',
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
            EXPANDED TELEMETRY & AUTOPSY DIAGNOSTIC REPORT
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
            KEEP INTEGRITY SCORECARD
          </h2>
        </div>

        <div style={{ height: '1px', backgroundColor: '#111111' }} />

        {/* 2-Column Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Left Column: Prior Autopsy Metric Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
              PRIMARY DIAGNOSTIC METRICS
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
                  SURVIVAL TIME
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(activeSurvivalTime)}s</div>
              </div>

              <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
                  ENERGY DISSIPATED
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{energyDissipatedJoules}kJ</div>
              </div>

              <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
                  SAND MASS ERODED
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{sandVolumeLostM3}m³</div>
              </div>

              <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
                  CURRENT INTEGRITY
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(currentKeepHealth)}%</div>
              </div>
            </div>

            <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
                PRIMARY FAILURE DIAGNOSTIC
              </span>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>{failureCause}</div>
            </div>

            <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
                COMPACTION GRADE
              </span>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
                {currentKeepHealth > 60 ? 'GRADE A - STRUCTURAL ROCK' : currentKeepHealth > 30 ? 'GRADE B - WET STAMP' : 'GRADE C - LOOSE SAND SLUMP'}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Non-Linear Telemetry Graphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
              LIVE HYDRODYNAMIC TELEMETRY GRAPHS
            </span>

            {/* Graph 1: Hydrodynamic Wave Impact Spikes (J/s) */}
            <div style={{ border: '1px solid #111111', padding: '8px 10px', backgroundColor: '#F3F0E6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: '#666660', marginBottom: '4px' }}>
                <span>WAVE IMPACT ENERGY (J/S)</span>
                <span style={{ color: '#111111', fontWeight: 800 }}>{Math.round(latestPt.waveEnergy)} J/s</span>
              </div>
              <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', width: '100%' }}>
                <line x1="0" y1="32" x2={chartWidth} y2="32" stroke="#DCD7C9" strokeWidth="1" strokeDasharray="3 3" />
                {wavePolyline && <polyline fill="none" stroke="#111111" strokeWidth="2" points={wavePolyline} />}
              </svg>
            </div>

            {/* Graph 2: Base Liquefaction Saturation Rate S-Curve (%) */}
            <div style={{ border: '1px solid #111111', padding: '8px 10px', backgroundColor: '#F3F0E6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: '#666660', marginBottom: '4px' }}>
                <span>BASE SATURATION S-CURVE (%)</span>
                <span style={{ color: '#111111', fontWeight: 800 }}>{Math.round(latestPt.saturationPercent)}%</span>
              </div>
              <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', width: '100%' }}>
                <line x1="0" y1="32" x2={chartWidth} y2="32" stroke="#DCD7C9" strokeWidth="1" strokeDasharray="3 3" />
                {satPolyline && <polyline fill="none" stroke="#111111" strokeWidth="2" points={satPolyline} />}
              </svg>
            </div>

            {/* Graph 3: Sand Mass Volume Retention Step-Curve (m³) */}
            <div style={{ border: '1px solid #111111', padding: '8px 10px', backgroundColor: '#F3F0E6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: '#666660', marginBottom: '4px' }}>
                <span>SAND MASS RETENTION (M³)</span>
                <span style={{ color: '#111111', fontWeight: 800 }}>{Math.round(latestPt.sandMassM3 * 100) / 100} m³</span>
              </div>
              <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', width: '100%' }}>
                <line x1="0" y1="32" x2={chartWidth} y2="32" stroke="#DCD7C9" strokeWidth="1" strokeDasharray="3 3" />
                {massPolyline && <polyline fill="none" stroke="#111111" strokeWidth="2" points={massPolyline} />}
              </svg>
            </div>
          </div>
        </div>

        {/* Return to Simulation Action Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
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
