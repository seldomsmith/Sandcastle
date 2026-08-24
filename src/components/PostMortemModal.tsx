/**
 * Sandcastle vs. Tide Simulator - Post-Mortem Autopsy Diagnostic Modal
 *
 * Displays end-of-simulation survival statistics, peak wave energy dissipated,
 * sand volume mass, compaction grade, defense score, and primary failure cause.
 */

import React from 'react';

interface PostMortemModalProps {
  isOpen: boolean;
  survivalTimeSec: number;
  keepHealthPercent: number;
  failureCause: string;
  energyDissipatedJoules?: number;
  sandMassVolume?: number;
  compactionGradePercent?: number;
  onRestart: () => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({
  isOpen,
  survivalTimeSec,
  keepHealthPercent,
  failureCause,
  energyDissipatedJoules = 4820,
  sandMassVolume = 14.2,
  compactionGradePercent = 88,
  onRestart
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        fontFamily: 'sans-serif'
      }}
    >
      <div
        style={{
          width: '460px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '28px',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '36px' }}>🌊</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f43f5e', letterSpacing: '0.02em' }}>
              SANDCASTLE AUTOPSY REPORT
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Diagnostic Structural Evaluation & Wave Energy Autopsy
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Primary Metrics 2x2 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>SURVIVAL TIME</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>
              {survivalTimeSec.toFixed(1)}s
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>KEEP INTEGRITY</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: keepHealthPercent > 50 ? '#34d399' : '#f43f5e' }}>
              {Math.round(keepHealthPercent)}%
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>ENERGY DISSIPATED</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
              {energyDissipatedJoules.toLocaleString()} J
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>SAND VOLUME</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#a7f3d0' }}>
              {sandMassVolume.toFixed(1)} m³
            </div>
          </div>
        </div>

        {/* Failure Cause Diagnostic */}
        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fda4af', marginBottom: '4px' }}>
            PRIMARY FAILURE DIAGNOSIS
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', lineHeight: '1.4' }}>
            {failureCause}
          </div>
        </div>

        {/* Defense Rating Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>COMPACTION GRADE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>{compactionGradePercent}% Efficiency</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>DEFENSE RATING</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>GRADE A-</div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          style={{
            padding: '14px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '13px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.4)'
          }}
        >
          🔄 Rebuild Fortress
        </button>
      </div>
    </div>
  );
};
