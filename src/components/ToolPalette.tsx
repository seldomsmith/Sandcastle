/**
 * Sandcastle vs. Tide Simulator - Tool Palette Component
 *
 * Left-side vertical glassmorphic dock allowing the user to select active sculpting tools
 * (Raise Sand, Dig Moat, Compact, Place Stone) or toggle Camera Orbit mode.
 */

import React from 'react';
import { ToolType } from '../types/simulation';

interface ToolPaletteProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brushRadius: number;
  onChangeRadius: (radius: number) => void;
  brushStrength: number;
  onChangeStrength: (strength: number) => void;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  activeTool,
  onSelectTool,
  brushRadius,
  onChangeRadius,
  brushStrength,
  onChangeStrength
}) => {
  const tools = [
    { type: ToolType.NONE, label: 'Camera Orbit (Pan)', icon: '🎥' },
    { type: ToolType.RAISE, label: 'Shovel (+ Sand)', icon: '⛰️' },
    { type: ToolType.DIG, label: 'Dig (- Moat)', icon: '⛏️' },
    { type: ToolType.COMPACT, label: 'Tamper (Compact)', icon: '🔨' },
    { type: ToolType.STONE, label: 'Pebbles (Stone)', icon: '🪨' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '80px',
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '16px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '210px'
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
        MODE & SCULPTING TOOLS
      </div>

      {/* Tool Selection Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tools.map((t) => {
          const isActive = activeTool === t.type;
          return (
            <button
              key={t.type}
              onClick={() => onSelectTool(t.type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: isActive ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
                color: isActive ? '#ffffff' : '#cbd5e1',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '14px' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTool !== ToolType.NONE && (
        <>
          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Brush Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Radius:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{brushRadius}</span>
              </div>
              <input
                type="range"
                min={2}
                max={16}
                value={brushRadius}
                onChange={(e) => onChangeRadius(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Strength:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{Math.round(brushStrength * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.1}
                step={0.01}
                value={brushStrength}
                onChange={(e) => onChangeStrength(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
