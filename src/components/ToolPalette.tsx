/**
 * Sandcastle vs. Tide Simulator - Tool Palette Component
 *
 * Left-side vertical glassmorphic dock allowing the user to select active sculpting tools:
 * Camera Orbit, Shovel, Dig, Tamper, Pebbles, 90° Wall, Turret Bucket, Culvert Pipe, Seashell Armor.
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
    { type: ToolType.WALL_90, label: '90° Wall (Chunks)', icon: '🧱' },
    { type: ToolType.BUCKET, label: 'Turret (Bucket)', icon: '🪣' },
    { type: ToolType.CULVERT, label: 'Culvert Trench', icon: '🕳️' },
    { type: ToolType.SHELLS, label: 'Seashell Armor', icon: '🐚' },
    { type: ToolType.STONE, label: 'Pebbles (Stone)', icon: '🪨' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '80px',
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '16px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '215px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto'
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
        MODE & SCULPTING TOOLS
      </div>

      {/* Tool Selection Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                padding: '7px 10px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: isActive ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
                color: isActive ? '#ffffff' : '#cbd5e1',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '13px' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTool !== ToolType.NONE && (
        <>
          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Brush Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
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
