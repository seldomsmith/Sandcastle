import React, { useRef } from 'react';

interface FrequencyGraphProps {
  routeId: string;
  frequencies: number[];
  onChange: (newFrequencies: number[]) => void;
}

const FrequencyGraph: React.FC<FrequencyGraphProps> = ({ frequencies, onChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  const handlePointerEvent = (e: React.PointerEvent) => {
    if (!isDragging.current && e.type !== 'pointerdown') return;
    if (e.type === 'pointerdown') isDragging.current = true;
    if (e.type === 'pointerup' || e.type === 'pointerleave') {
      isDragging.current = false;
      return;
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      // 24 segments
      const segmentWidth = rect.width / 23;
      const hourIndex = Math.round(x / segmentWidth);
      
      // y to frequency (0 to 10 max)
      const newFreq = Math.max(0, Math.min(10, Math.round(10 - (y / rect.height) * 10)));
      
      if (frequencies[hourIndex] !== newFreq) {
        const newArr = [...frequencies];
        // Apply bell curve smoothing around the dragged point
        newArr[hourIndex] = newFreq;
        if (hourIndex > 0) newArr[hourIndex - 1] = Math.round((newArr[hourIndex - 1] + newFreq) / 2);
        if (hourIndex < 23) newArr[hourIndex + 1] = Math.round((newArr[hourIndex + 1] + newFreq) / 2);
        
        onChange(newArr);
      }
    }
  };

  const pts = frequencies.slice(0, 24).map((f, i) => {
    const x = (i / 23) * 100;
    const y = 100 - (f / 10) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="frequency-graph">
      <div style={{ marginBottom: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule</div>
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.5)', cursor: 'crosshair', borderRadius: '4px' }}
        onPointerDown={handlePointerEvent}
        onPointerMove={handlePointerEvent}
        onPointerUp={handlePointerEvent}
        onPointerLeave={handlePointerEvent}
      >
        <polyline points={pts} fill="none" stroke="#FF00FF" strokeWidth="2" />
        {frequencies.slice(0,24).map((f, i) => (
          <circle key={i} cx={(i / 23) * 100} cy={100 - (f / 10) * 100} r="2" fill="#FFFFFF" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '4px', color: '#999' }}>
        <span>00:00</span>
        <span>12:00</span>
        <span>23:59</span>
      </div>
    </div>
  );
};

export default FrequencyGraph;
