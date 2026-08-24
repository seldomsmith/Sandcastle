/**
 * Sandcastle vs. Tide Simulator - Warm Technical Neo-Brutalist Sculpting Tool Palette
 *
 * Warm Technical Neo-Brutalist design language:
 * Background #F3F0E6, Borders 1px solid #111111, Radius 0px, Active #111111, Zero Emojis.
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
    { type: ToolType.NONE, label: 'Camera Orbit (Pan)' },
    { type: ToolType.RAISE, label: 'Shovel (+ Sand)' },
    { type: ToolType.DIG, label: 'Dig (- Moat)' },
    { type: ToolType.COMPACT, label: 'Flatten / Rolling Pin' },
    { type: ToolType.WALL_90, label: '90° Wall (Chunks)' },
    { type: ToolType.BUCKET, label: 'Turret (Bucket)' },
    { type: ToolType.CULVERT, label: 'Culvert Trench' },
    { type: ToolType.SHELLS, label: 'Seashell Armor' },
    { type: ToolType.STONE, label: 'Pebbles (Stone)' }
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
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

          if (dist < 20) {
            bedHeight[idx] = 0.55;
            compaction[idx] = 1.0;
          } else if (dist >= 20 && dist < 30) {
            bedHeight[idx] = 0.02;
          } else if (dist >= 30 && dist < 42) {
            bedHeight[idx] = 0.42;
            compaction[idx] = 0.9;
          } else if (dist >= 42 && dist < 52) {
            bedHeight[idx] = 0.02;
          } else if (dist >= 52 && dist < 62) {
            bedHeight[idx] = 0.35;
          }
        }
      }
    } else if (blueprintType === 'motte') {
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
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (y >= 45 && y <= 65 && x >= 40 && x <= 216) {
            bedHeight[idx] = 0.48;
            materialFlags[idx] = 2.0;
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
        width: '230px',
        backgroundColor: '#F3F0E6',
        border: '1px solid #111111',
        borderRadius: '0px',
        padding: '14px',
        color: '#111111',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}
    >
      {/* 1-Click Castle Blueprints Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
          CASTLE BLUEPRINTS
        </span>
        <select
          onChange={(e) => handleLoadBlueprint(e.target.value)}
          defaultValue=""
          style={{
            backgroundColor: '#F3F0E6',
            color: '#111111',
            fontSize: '11px',
            fontWeight: 700,
            border: '1px solid #111111',
            borderRadius: '0px',
            padding: '5px 8px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="" disabled>
            Load Blueprint...
          </option>
          <option value="citadel">Triple Moat Citadel</option>
          <option value="motte">Motte-and-Bailey Fortress</option>
          <option value="redoubt">Seawall Wave Redoubt</option>
        </select>
      </div>

      <div style={{ height: '1px', backgroundColor: '#111111' }} />

      {/* Mode & Sculpting Tools Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#666660', letterSpacing: '0.05em' }}>
          SCULPTING TOOLS
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {tools.map((t) => {
            const isActive = activeTool === t.type;
            return (
              <React.Fragment key={t.type}>
                <button
                  onClick={() => onSelectTool(t.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '0px',
                    border: '1px solid #111111',
                    backgroundColor: isActive ? '#111111' : '#F3F0E6',
                    color: isActive ? '#FFFFFF' : '#111111',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <span>{t.label}</span>
                </button>

                {/* Sub-Options for Flatten / Rolling Pin Tool */}
                {t.type === ToolType.COMPACT && isActive && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      paddingTop: '2px',
                      paddingBottom: '2px'
                    }}
                  >
                    <button
                      onClick={() => setFlattenAngle(0)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '9px',
                        fontWeight: flattenAngle === 0 ? 700 : 500,
                        borderRadius: '0px',
                        border: '1px solid #111111',
                        backgroundColor: flattenAngle === 0 ? '#111111' : '#F3F0E6',
                        color: flattenAngle === 0 ? '#FFFFFF' : '#111111',
                        cursor: 'pointer'
                      }}
                    >
                      0° TABLE-TOP
                    </button>
                    <button
                      onClick={() => setFlattenAngle(45)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '9px',
                        fontWeight: flattenAngle === 45 ? 700 : 500,
                        borderRadius: '0px',
                        border: '1px solid #111111',
                        backgroundColor: flattenAngle === 45 ? '#111111' : '#F3F0E6',
                        color: flattenAngle === 45 ? '#FFFFFF' : '#111111',
                        cursor: 'pointer'
                      }}
                    >
                      45° RAMP
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#111111' }} />

      {/* Sliders for Brush Radius and Strength */}
      {activeTool !== ToolType.NONE && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#666660' }}>
              <span>BRUSH RADIUS</span>
              <span style={{ color: '#111111' }}>{brushRadius} cells</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              value={brushRadius}
              onChange={(e) => onChangeRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#111111', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#666660' }}>
              <span>BRUSH STRENGTH</span>
              <span style={{ color: '#111111' }}>{brushStrength}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={brushStrength}
              onChange={(e) => onChangeStrength(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#111111', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
