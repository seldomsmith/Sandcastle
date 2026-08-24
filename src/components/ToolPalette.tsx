/**
 * Sandcastle vs. Tide Simulator - Left Sculpting Tool Palette & Preset Blueprints
 *
 * Left floating sidebar providing 1-click Castle Blueprints loader, mode tools
 * (Camera Orbit, Shovel, Dig, Flatten Rolling Pin with 0°/45° sub-options, 90° Wall, Turret Bucket),
 * and brush radius / strength sliders.
 */

import React, { useState } from 'react';
import { ToolType } from '../types/simulation';
import { WorkerBridge } from '../bridge/WorkerBridge';

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
  const [flattenAngle, setFlattenAngle] = useState<number>(0);

  const tools = [
    { type: ToolType.NONE, label: 'Camera Orbit (Pan)', icon: '🎥' },
    { type: ToolType.RAISE, label: 'Shovel (+ Sand)', icon: '⛰️' },
    { type: ToolType.DIG, label: 'Dig (- Moat)', icon: '⛏️' },
    { type: ToolType.COMPACT, label: 'Flatten / Rolling Pin', icon: '🧹' },
    { type: ToolType.WALL_90, label: '90° Wall (Chunks)', icon: '🧱' },
    { type: ToolType.BUCKET, label: 'Turret (Bucket)', icon: '🪣' },
    { type: ToolType.CULVERT, label: 'Culvert Trench', icon: '🕳️' },
    { type: ToolType.SHELLS, label: 'Seashell Armor', icon: '🐚' },
    { type: ToolType.STONE, label: 'Pebbles (Stone)', icon: '🪨' }
  ];

  const handleLoadBlueprint = (blueprintType: string) => {
    const bridge = WorkerBridge.getInstance();
    const buffers = bridge.getBuffers();
    if (!buffers) return;

    const { bedHeight, compaction, materialFlags } = buffers;
    const W = 256;
    const H = 256;
    const centerX = W / 2;
    const centerY = H / 2;

    if (blueprintType === 'citadel') {
      // Triple Moat Citadel
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

          if (dist < 20) {
            bedHeight[idx] = 0.55;
            compaction[idx] = 1.0;
          } else if (dist >= 20 && dist < 30) {
            bedHeight[idx] = 0.02; // Moat 1
          } else if (dist >= 30 && dist < 42) {
            bedHeight[idx] = 0.42; // Outer Wall 1
            compaction[idx] = 0.9;
          } else if (dist >= 42 && dist < 52) {
            bedHeight[idx] = 0.02; // Moat 2
          } else if (dist >= 52 && dist < 62) {
            bedHeight[idx] = 0.35; // Outer Wall 2
          }
        }
      }
    } else if (blueprintType === 'motte') {
      // Motte and Bailey
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          const distMotte = Math.sqrt((x - (centerX - 35)) ** 2 + (y - centerY) ** 2);
          const distBailey = Math.sqrt((x - (centerX + 25)) ** 2 + (y - centerY) ** 2);

          if (distMotte < 22) {
            bedHeight[idx] = 0.65;
            compaction[idx] = 1.0;
          } else if (distBailey < 35) {
            bedHeight[idx] = 0.32;
            compaction[idx] = 0.8;
          }
        }
      }
    } else if (blueprintType === 'redoubt') {
      // Seawall Redoubt
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (y >= 45 && y <= 65 && x >= 40 && x <= 216) {
            bedHeight[idx] = 0.48;
            materialFlags[idx] = 2.0; // 90 Wall
            compaction[idx] = 1.0;
          }
        }
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '240px',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px',
        borderRadius: '18px',
        color: '#f8fafc',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        fontFamily: 'sans-serif'
      }}
    >
      {/* 1-Click Castle Blueprints Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
          CASTLE BLUEPRINTS
        </span>
        <select
          onChange={(e) => handleLoadBlueprint(e.target.value)}
          defaultValue=""
          style={{
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 700,
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="" disabled>
            🏰 Load 1-Click Castle...
          </option>
          <option value="citadel">Triple Moat Citadel</option>
          <option value="motte">Motte-and-Bailey Fortress</option>
          <option value="redoubt">Seawall Wave Redoubt</option>
        </select>
      </div>

      <div style={{ height: '1px', backgroundColor: '#334155' }} />

      {/* Mode & Sculpting Tools Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
          MODE & SCULPTING TOOLS
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tools.map((t) => {
            const isActive = activeTool === t.type;
            return (
              <React.Fragment key={t.type}>
                <button
                  onClick={() => onSelectTool(t.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '10px',
                    border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                    backgroundColor: isActive ? '#0284c7' : '#1e293b',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>

                {/* Sub-Options for Flatten / Rolling Pin Tool */}
                {t.type === ToolType.COMPACT && isActive && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      paddingLeft: '12px',
                      paddingTop: '2px',
                      paddingBottom: '4px'
                    }}
                  >
                    <button
                      onClick={() => setFlattenAngle(0)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: flattenAngle === 0 ? 700 : 500,
                        borderRadius: '6px',
                        border: flattenAngle === 0 ? '1px solid #38bdf8' : '1px solid #334155',
                        backgroundColor: flattenAngle === 0 ? '#0369a1' : '#0f172a',
                        color: flattenAngle === 0 ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      📐 0° Table-Top
                    </button>
                    <button
                      onClick={() => setFlattenAngle(45)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: flattenAngle === 45 ? 700 : 500,
                        borderRadius: '6px',
                        border: flattenAngle === 45 ? '1px solid #38bdf8' : '1px solid #334155',
                        backgroundColor: flattenAngle === 45 ? '#0369a1' : '#0f172a',
                        color: flattenAngle === 45 ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      📐 45° Ramp
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#334155' }} />

      {/* Sliders for Brush Radius and Strength */}
      {activeTool !== ToolType.NONE && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
              <span>BRUSH RADIUS</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{brushRadius} cells</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              value={brushRadius}
              onChange={(e) => onChangeRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
              <span>BRUSH STRENGTH</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{brushStrength}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={brushStrength}
              onChange={(e) => onChangeStrength(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
