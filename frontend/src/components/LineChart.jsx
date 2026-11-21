import { useState } from 'react';
import { niceTicks } from './chartUtils.js';

const W = 560;
const H = 240;
const PAD = { top: 16, right: 64, bottom: 36, left: 36 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

// Lines over evenly spaced x values, with a crosshair tooltip and end-of-line labels.
// series: [{ name, className, points: [{ x, y }] }] - points with y === null are skipped.
export default function LineChart({ series, xValues, xLabel, yLabel, renderTooltip, ariaLabel }) {
  const [hoverX, setHoverX] = useState(null);
  const ys = series.flatMap((s) => s.points.filter((p) => p.y !== null).map((p) => Number(p.y)));
  const ticks = niceTicks(Math.max(0, ...ys));
  const top = ticks[ticks.length - 1];
  const step = xValues.length > 1 ? INNER_W / (xValues.length - 1) : 0;
  const x = (v) =>
    xValues.length > 1 ? PAD.left + xValues.indexOf(v) * step : PAD.left + INNER_W / 2;
  const y = (v) => PAD.top + INNER_H - (Number(v) / top) * INNER_H;

  const drawn = series.map((s) => ({ ...s, points: s.points.filter((p) => p.y !== null) }));

  // End labels: at each line's last point, nudged apart when they would overlap.
  const labels = drawn
    .filter((s) => s.points.length)
    .map((s) => {
      const last = s.points[s.points.length - 1];
      return { name: s.name, className: s.className, x: x(last.x) + 8, y: y(last.y) };
    })
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
  }

  return (
    <div className="chart chart-wide">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              className="chart-grid"
              x1={PAD.left}
              x2={PAD.left + INNER_W}
              y1={y(t)}
              y2={y(t)}
            />
            <text className="chart-tick" x={PAD.left - 6} y={y(t)} textAnchor="end" dy="0.32em">
              {t}
            </text>
          </g>
        ))}
        {xValues.map((v) => (
          <text key={v} className="chart-tick" x={x(v)} y={y(0) + 14} textAnchor="middle">
            {v}
          </text>
        ))}
        <line className="chart-axis" x1={PAD.left} x2={PAD.left + INNER_W} y1={y(0)} y2={y(0)} />
        {hoverX !== null && (
          <line className="chart-crosshair" x1={x(hoverX)} x2={x(hoverX)} y1={PAD.top} y2={y(0)} />
        )}
        {drawn.map((s) => (
          <g key={s.name} className={s.className}>
            <path
              className="line"
              d={s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`).join(' ')}
            />
            {s.points.map((p) => (
              <circle key={p.x} className="line-marker" cx={x(p.x)} cy={y(p.y)} r={4} />
            ))}
          </g>
        ))}
        {labels.map((l) => (
          <text key={l.name} className="chart-direct-label" x={l.x} y={l.y} dy="0.32em">
            {l.name}
          </text>
        ))}
        {xValues.map((v) => (
          <rect
            key={v}
            x={x(v) - Math.max(step, 24) / 2}
            y={PAD.top}
            width={Math.max(step, 24)}
            height={INNER_H}
            fill="transparent"
            tabIndex={0}
            onPointerEnter={() => setHoverX(v)}
            onPointerLeave={() => setHoverX(null)}
            onFocus={() => setHoverX(v)}
            onBlur={() => setHoverX(null)}
          />
        ))}
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
      {hoverX !== null && (
        <div
          className="chart-tooltip"
          style={{ left: `${(x(hoverX) / W) * 100}%`, top: `${(PAD.top / H) * 100}%` }}
        >
          {renderTooltip(hoverX)}
        </div>
      )}
    </div>
  );
}
