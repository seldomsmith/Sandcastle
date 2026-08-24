/**
 * Sandcastle vs. Tide Simulator - Tool Palette Component
 *
 * Floating glassmorphic bar allowing the user to select active sculpting tools
 * (Raise Sand, Dig Moat, Compact, Place Stone) and adjust brush radius/strength.
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
    { type: ToolType.RAISE, label: 'Shovel (+ Sand)', icon: '⛰️' },
    { type: ToolType.DIG, label: 'Dig (- Moat)', icon: '⛏️' },
    { type: ToolType.COMPACT, label: 'Tamper (Compact)', icon: '🔨' },
    { type: ToolType.STONE, label: 'Pebbles (Stone)', icon: '🪨' }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-white/15 px-6 py-3.5 rounded-2xl shadow-2xl pointer-events-auto">
      {/* Tool Selection Buttons */}
      <div className="flex items-center gap-2.5">
        {tools.map((t) => {
          const isActive = activeTool === t.type;
          return (
            <button
              key={t.type}
              onClick={() => onSelectTool(t.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Brush Sliders */}
      <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
        <div className="flex items-center gap-2">
          <span>Radius:</span>
          <input
            type="range"
            min={2}
            max={16}
            value={brushRadius}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="w-28 accent-sky-400 cursor-pointer"
          />
          <span className="w-5 text-right font-bold text-sky-400">{brushRadius}</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Strength:</span>
          <input
            type="range"
            min={0.01}
            max={0.1}
            step={0.01}
            value={brushStrength}
            onChange={(e) => onChangeStrength(Number(e.target.value))}
            className="w-28 accent-sky-400 cursor-pointer"
          />
          <span className="w-8 text-right font-bold text-sky-400">
            {Math.round(brushStrength * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
