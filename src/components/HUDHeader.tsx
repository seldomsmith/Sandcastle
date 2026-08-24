/**
 * Sandcastle vs. Tide Simulator - HUD Telemetry Header
 *
 * Top floating bar displaying Keep Integrity, Tide status, simulation frame counter,
 * performance metrics, play/pause controls, stress heatmap toggle, and castle sharing.
 */

import React from 'react';

interface HUDHeaderProps {
  isTideActive: boolean;
  frameCount: number;
  lastTickMs: number;
  isSharedMemory: boolean;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  onShare: () => void;
  onStartTide: () => void;
  onPauseTide: () => void;
  onReset: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  isTideActive,
  frameCount,
  lastTickMs,
  isSharedMemory,
  showHeatmap,
  onToggleHeatmap,
  onShare,
  onStartTide,
  onPauseTide,
  onReset
}) => {
  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
      {/* Telemetry Status Gauges */}
      <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl pointer-events-auto text-xs font-mono text-slate-300 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">ENGINE:</span>
          <span className="font-bold text-white">60 Hz</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <div>
          <span className="text-slate-400">TICK:</span>{' '}
          <span className="font-bold text-sky-400">{lastTickMs.toFixed(1)}ms</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <div>
          <span className="text-slate-400">FRAME:</span>{' '}
          <span className="font-bold text-white">{frameCount}</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <div>
          <span className="text-slate-400">MEMORY:</span>{' '}
          <span className={isSharedMemory ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isSharedMemory ? 'Zero-Copy SAB' : 'ArrayBuffer'}
          </span>
        </div>
      </div>

      {/* Tide Controls, Heatmap & Share Buttons */}
      <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl pointer-events-auto shadow-lg">
        <button
          onClick={onToggleHeatmap}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
            showHeatmap
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {showHeatmap ? '🔥 Stress Heatmap ON' : '🌡️ Heatmap OFF'}
        </button>

        <button
          onClick={onShare}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-lg transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
        >
          <span>🔗</span> Share Castle
        </button>

        <div className="h-3 w-px bg-slate-700 mx-1" />

        {isTideActive ? (
          <button
            onClick={onPauseTide}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
          >
            Pause Tide
          </button>
        ) : (
          <button
            onClick={onStartTide}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-rose-600/30 cursor-pointer"
          >
            Start Tide Surge
          </button>
        )}

        <button
          onClick={onReset}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-all border border-slate-700 cursor-pointer"
        >
          Reset Map
        </button>
      </div>
    </div>
  );
};
