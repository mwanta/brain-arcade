import { useState } from 'react';
import { niceTicks, topRoundedBar } from './chartUtils.js';

const W = 320;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 36, left: 34 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

// Vertical bars on a count axis. bars: [{ key, label, value, highlight }].
// Highlighted bars use the "you" color; hovering or focusing a bar shows renderTooltip(bar).
export default function BarChart({ bars, xLabel, yLabel, renderTooltip, ariaLabel }) {
  const [hoverKey, setHoverKey] = useState(null);
  const ticks = niceTicks(Math.max(0, ...bars.map((b) => b.value)), 4, true);
  const top = ticks[ticks.length - 1];
  const band = INNER_W / bars.length;
  const barWidth = Math.max(4, Math.min(40, band - 4));
  const y = (v) => PAD.top + INNER_H - (v / top) * INNER_H;
  const hoverIndex = bars.findIndex((b) => b.key === hoverKey);
  const hovered = bars[hoverIndex];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="chart-tick" x={PAD.left - 6} y={y(t)} textAnchor="end" dy="0.32em">
              {t}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const center = PAD.left + band * i + band / 2;
          return (
            <g
              key={b.key}
              tabIndex={0}
              onPointerEnter={() => setHoverKey(b.key)}
              onPointerLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(b.key)}
              onBlur={() => setHoverKey(null)}
            >
              <path
                className={b.highlight ? 'bar bar-you' : 'bar'}
                d={topRoundedBar(center - barWidth / 2, y(b.value), barWidth, y(0) - y(b.value))}
              />
              <text className="chart-tick" x={center} y={y(0) + 14} textAnchor="middle">
                {b.label}
              </text>
              <rect
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={INNER_H}
                fill="transparent"
              />
            </g>
          );
        })}
        <line className="chart-axis" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        <text className="chart-axis-label" x={PAD.left + INNER_W / 2} y={H - 4} textAnchor="middle">
          {xLabel}
        </text>
        <text
          className="chart-axis-label"
          transform={`translate(10 ${PAD.top + INNER_H / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {yLabel}
        </text>
      </svg>
      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD.left + band * hoverIndex + band / 2) / W) * 100}%`,
            top: `${(y(hovered.value) / H) * 100}%`,
          }}
        >
          {renderTooltip(hovered)}
        </div>
      )}
    </div>
  );
}
