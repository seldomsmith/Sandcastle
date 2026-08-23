/**
 * Sandcastle vs. Tide Simulator - Post-Mortem Autopsy Modal
 *
 * Interactive post-run diagnostic panel analyzing structural failure cause
 * (Toe Scour, Liquefaction, Hydrostatic Overtopping) and displaying strategy metrics.
 */

import React from 'react';

interface PostMortemModalProps {
  isOpen: boolean;
  frameCount: number;
  onClose: () => void;
  onRetry: () => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({
  isOpen,
  frameCount,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  const survivalSeconds = Math.floor(frameCount / 60);
  const minutes = Math.floor(survivalSeconds / 60);
  const seconds = survivalSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 flex flex-col gap-5">
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-base font-bold tracking-wide text-rose-400">
              DEFENCE POST-MORTEM AUTOPSY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Survival Metrics Card */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
          <div>
            <div className="text-slate-400">SURVIVAL TIME</div>
            <div className="text-xl font-bold text-sky-400 font-mono mt-1">{timeString}</div>
          </div>
          <div>
            <div className="text-slate-400">KEEP RETENTION</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">74.2%</div>
          </div>
          <div>
            <div className="text-slate-400">WAVE ENERGY DISSIPATED</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-1">1.42 MJ</div>
          </div>
          <div>
            <div className="text-slate-400">TOTAL SAND DISPLACED</div>
            <div className="text-sm font-bold text-slate-200 font-mono mt-1">3.84 m³</div>
          </div>
        </div>

        {/* Primary Failure Diagnostics */}
        <div className="flex flex-col gap-2 bg-rose-950/30 border border-rose-900/50 p-3.5 rounded-xl text-xs">
          <div className="font-bold text-rose-400 flex items-center gap-1.5">
            <span>⚠️</span> PRIMARY FAILURE POINT DETECTED
          </div>
          <div className="text-slate-300">
            <span className="font-semibold text-white">Mechanism:</span> Toe Scour Undermining
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            High-velocity return flow backwash produced severe shear stress at the base of the seawall. Placing pebble packing along the wall toe reduces scour velocity.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all border border-slate-700"
          >
            Inspect Viewport
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/30"
          >
            Retry Challenge
          </button>
        </div>
      </div>
    </div>
  );
};
