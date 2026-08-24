/**
 * Sandcastle vs. Tide Simulator - Warm Technical Neo-Brutalist HUD Header
 *
 * Warm Technical Neo-Brutalist design language:
 * Background #F3F0E6, Borders 1px solid #111111, Radius 0px, Active #111111, Zero Emojis.
 */

import React from 'react';
import { COASTAL_SCENARIOS } from '../config/scenarios';
import { LIGHTING_PRESETS, LightingPreset } from '../config/lightingPresets';
import { BeachDomainPreset } from '../config/constants';
import { WorkerBridge } from '../bridge/WorkerBridge';

interface HUDHeaderProps {
  isTideActive: boolean;
  frameCount: number;
  lastTickMs: number;
  isSharedMemory: boolean;
  showHeatmap: boolean;
  showContours: boolean;
  speedMultiplier: number;
  keepHealthPercent: number;
  activeLighting: LightingPreset;
  activeBeachPreset: BeachDomainPreset;
  onChangeLighting: (preset: LightingPreset) => void;
  onChangeBeachPreset: (preset: BeachDomainPreset) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleHeatmap: () => void;
  onToggleContours: () => void;
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
  showContours,
  speedMultiplier,
  keepHealthPercent,
  activeLighting,
  activeBeachPreset,
  onChangeLighting,
  onChangeBeachPreset,
  onChangeSpeed,
  onToggleHeatmap,
  onToggleContours,
  onShare,
  onStartTide,
  onPauseTide,
  onReset
}) => {
  const speeds = [0.5, 1, 2, 5, 10, 25];

  const handleScenarioChange = (scenarioId: string) => {
    const preset = COASTAL_SCENARIOS.find((s) => s.id === scenarioId);
    if (preset) {
      WorkerBridge.getInstance().updateScenario(preset.config);
    }
  };

  const beachPresets = [
    { id: BeachDomainPreset.STANDARD_256, name: 'Standard (6.4m × 6.4m)' },
    { id: BeachDomainPreset.WIDE_384, name: 'Wide (9.6m × 6.4m)' },
    { id: BeachDomainPreset.LONG_384, name: 'Long (6.4m × 9.6m)' },
    { id: BeachDomainPreset.MEGA_512, name: 'Mega (12.8m × 12.8m)' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}
    >
      {/* Warm Technical Neo-Brutalist Card Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          backgroundColor: '#F3F0E6',
          border: '1px solid #111111',
          borderRadius: '0px',
          padding: '8px 16px',
          fontSize: '11px',
          color: '#111111',
          pointerEvents: 'auto'
        }}
      >
        {/* Keep Health Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
              <span style={{ color: '#666660' }}>KEEP INTEGRITY</span>
              <span style={{ color: '#111111', marginLeft: '8px', fontWeight: 800 }}>
                {Math.round(keepHealthPercent)}%
              </span>
            </div>
            <div style={{ width: '100px', height: '6px', backgroundColor: '#DCD7C9', border: '1px solid #111111', borderRadius: '0px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, keepHealthPercent))}%`,
                  height: '100%',
                  backgroundColor: '#111111',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#111111' }} />

        {/* Beach Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#666660', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>BEACH SIZE</span>
          <select
            value={activeBeachPreset}
            onChange={(e) => onChangeBeachPreset(e.target.value as BeachDomainPreset)}
            style={{
              backgroundColor: '#F3F0E6',
              color: '#111111',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #111111',
              borderRadius: '0px',
              padding: '3px 8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {beachPresets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#111111' }} />

        {/* Lighting Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#666660', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>LIGHTING</span>
          <select
            value={activeLighting.id}
            onChange={(e) => {
              const selected = LIGHTING_PRESETS.find((p) => p.id === e.target.value);
              if (selected) onChangeLighting(selected);
            }}
            style={{
              backgroundColor: '#F3F0E6',
              color: '#111111',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #111111',
              borderRadius: '0px',
              padding: '3px 8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {LIGHTING_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#111111' }} />

        {/* Scenario Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#666660', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>SCENARIO</span>
          <select
            onChange={(e) => handleScenarioChange(e.target.value)}
            style={{
              backgroundColor: '#F3F0E6',
              color: '#111111',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #111111',
              borderRadius: '0px',
              padding: '3px 8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {COASTAL_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tide Controls & Toggles Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#F3F0E6',
          border: '1px solid #111111',
          borderRadius: '0px',
          padding: '8px 16px',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '10px', color: '#666660', fontWeight: 700, marginRight: '4px', letterSpacing: '0.05em' }}>SPEED</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              style={{
                padding: '3px 7px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '0px',
                border: '1px solid #111111',
                backgroundColor: speedMultiplier === s ? '#111111' : '#F3F0E6',
                color: speedMultiplier === s ? '#FFFFFF' : '#111111',
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        <div style={{ height: '16px', width: '1px', backgroundColor: '#111111', margin: '0 2px' }} />

        <button
          onClick={onToggleContours}
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '0px',
            cursor: 'pointer',
            border: '1px solid #111111',
            backgroundColor: showContours ? '#111111' : '#F3F0E6',
            color: showContours ? '#FFFFFF' : '#111111'
          }}
        >
          {showContours ? 'CONTOURS ON' : 'CONTOURS OFF'}
        </button>

        <button
          onClick={onToggleHeatmap}
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '0px',
            cursor: 'pointer',
            border: '1px solid #111111',
            backgroundColor: showHeatmap ? '#111111' : '#F3F0E6',
            color: showHeatmap ? '#FFFFFF' : '#111111'
          }}
        >
          {showHeatmap ? 'HEATMAP ON' : 'HEATMAP OFF'}
        </button>

        <button
          onClick={onShare}
          style={{
            padding: '4px 10px',
            backgroundColor: '#F3F0E6',
            color: '#111111',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '0px',
            border: '1px solid #111111',
            cursor: 'pointer'
          }}
        >
          SHARE CASTLE
        </button>

        <div style={{ height: '16px', width: '1px', backgroundColor: '#111111', margin: '0 2px' }} />

        {isTideActive ? (
          <button
            onClick={onPauseTide}
            style={{
              padding: '4px 12px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '10px',
              borderRadius: '0px',
              border: '1px solid #111111',
              cursor: 'pointer'
            }}
          >
            PAUSE TIDE
          </button>
        ) : (
          <button
            onClick={onStartTide}
            style={{
              padding: '4px 12px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '10px',
              borderRadius: '0px',
              border: '1px solid #111111',
              cursor: 'pointer'
            }}
          >
            START TIDE SURGE
          </button>
        )}

        <button
          onClick={onReset}
          style={{
            padding: '4px 10px',
            backgroundColor: '#F3F0E6',
            color: '#111111',
            fontWeight: 700,
            fontSize: '10px',
            borderRadius: '0px',
            border: '1px solid #111111',
            cursor: 'pointer'
          }}
        >
          RESET MAP
        </button>
      </div>
    </div>
  );
};
