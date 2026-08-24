/**
 * Sandcastle vs. Tide Simulator - Post-Mortem Autopsy Diagnostic Modal
 *
 * Displays end-of-simulation survival statistics, peak wave energy dissipated,
 * and failure cause analysis (Toe Scour, Liquefaction, Seawall Overtopping).
 */

import React from 'react';

interface PostMortemModalProps {
  isOpen: boolean;
  survivalTimeSec: number;
  keepHealthPercent: number;
  failureCause: string;
  onRestart: () => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({
  isOpen,
  survivalTimeSec,
  keepHealthPercent,
  failureCause,
  onRestart
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        fontFamily: 'sans-serif'
      }}
    >
      <div
        style={{
          width: '420px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '28px',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🌊</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f43f5e' }}>
              SANDCASTLE AUTOPSY REPORT
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Structural Evaluation & Failure Diagnosis
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>SURVIVAL TIME</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>
              {survivalTimeSec.toFixed(1)}s
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>KEEP INTEGRITY</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: keepHealthPercent > 50 ? '#34d399' : '#f43f5e' }}>
              {Math.round(keepHealthPercent)}%
            </div>
          </div>
        </div>

        {/* Failure Cause Diagnosis */}
        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fda4af', marginBottom: '4px' }}>
            PRIMARY FAILURE CAUSE
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
            {failureCause}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          style={{
            padding: '12px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
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
