/**
 * Sandcastle vs. Tide Simulator - Warm Technical Neo-Brutalist Post-Mortem Autopsy Modal
 *
 * Warm Technical Neo-Brutalist design language:
 * Background #F3F0E6, Borders 1px solid #111111, Radius 0px, Active #111111, Zero Emojis.
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

  const energyDissipatedJoules = Math.round(survivalTimeSec * 14.5 * 10) / 10;
  const sandVolumeLostM3 = Math.round((1.0 - keepHealthPercent / 100) * 0.42 * 100) / 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        backgroundColor: 'rgba(17, 17, 17, 0.6)',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#F3F0E6',
          border: '1px solid #111111',
          borderRadius: '0px',
          padding: '24px',
          width: '420px',
          color: '#111111',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#666660', letterSpacing: '0.08em' }}>
            POST-MORTEM AUTOPSY DIAGNOSTIC
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
            KEEP BREACH DETECTED
          </h2>
        </div>

        <div style={{ height: '1px', backgroundColor: '#111111' }} />

        {/* Core Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
              SURVIVAL TIME
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(survivalTimeSec)}s</div>
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
              FINAL INTEGRITY
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(keepHealthPercent)}%</div>
          </div>
        </div>

        {/* Primary Failure Cause Card */}
        <div style={{ border: '1px solid #111111', padding: '10px', backgroundColor: '#F3F0E6' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
            PRIMARY FAILURE CAUSE
          </span>
          <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>{failureCause}</div>
        </div>

        {/* Restart Action Button */}
        <button
          onClick={onRestart}
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
          REBUILD FORTRESS (RESET MAP)
        </button>
      </div>
    </div>
  );
};
