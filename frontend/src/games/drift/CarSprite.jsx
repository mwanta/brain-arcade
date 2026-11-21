import { forwardRef } from 'react';
import { ART, BEAM_ROWS, PUFFS, PX, SKID_DISTANCES, SKID_SIDE } from './carShape.js';
import { directionAngle, directionVector, snapToGrid, translateAttr } from './geometry.js';

const CLASSES = {
  O: 'drift-outline',
  B: 'drift-body',
  S: 'drift-stripe',
  G: 'drift-windshield',
  R: 'drift-rear-window',
  L: 'drift-lamp',
  W: 'drift-wheel',
};
const ART_X = (-ART[0].length * PX) / 2;
const ART_Y = (-ART.length * PX) / 2;

// Merge each row's runs of the same pixel into one rect.
const RUNS = ART.flatMap((row, r) => {
  const runs = [];
  for (let c = 0; c < row.length; c++) {
    if (row[c] === '.') continue;
    const last = runs[runs.length - 1];
    if (last && last.ch === row[c] && last.c + last.n === c) last.n += 1;
    else runs.push({ ch: row[c], c, n: 1 });
  }
  return runs.map((run) => ({
    cls: CLASSES[run.ch],
    x: ART_X + run.c * PX,
    y: ART_Y + r * PX,
    w: run.n * PX,
  }));
});

// Headlight beams: stepped cones that widen ahead of each lamp, one pixel row at a time.
const BEAMS = Array.from({ length: BEAM_ROWS }, (_, i) => {
  const k = i + 1;
  const y = ART_Y - k * PX;
  return [
    { x: -2 * PX - (k - 1) * PX, y, w: k * PX },
    { x: PX, y, w: k * PX },
  ];
}).flat();

/**
 * One car, top-down, as pixel art. The art points up and is rotated to `facing`. Drifting cars are
 * blue and driving cars red, but every cue also has a shape, so none relies on colour alone:
 *   front = narrow nose, headlamp row and pale windshield (the tail has a wide spoiler and a dark window)
 *   lights = every car has headlights on: two stepped beam cones plus bright headlamps
 *   drift = smoke blocks and skid dashes trailing behind `moving`,
 *           drawn unrotated
 *
 * The outer <g> takes its position from x/y (snapped to the pixel grid); DriftBoard also
 * rewrites its transform directly every frame while animating.
 *
 * @param {{
 *   x: number, y: number,
 *   facing: 'up' | 'down' | 'left' | 'right',
 *   moving: 'up' | 'down' | 'left' | 'right',
 *   state: 'drive' | 'drift',
 * }} props `moving` is the direction of travel, which places the drift trail.
 */
const CarSprite = forwardRef(function CarSprite({ x, y, facing, moving, state }, ref) {
  const drifting = state === 'drift';
  // The trail sits opposite the direction of travel, which may differ from the facing.
  const travel = directionVector(moving);
  const back = { x: -travel.x, y: -travel.y };
  const side = { x: -back.y, y: back.x }; // perpendicular, for sideways offsets
  const at = (dist, off) => ({
    x: back.x * dist + side.x * off,
    y: back.y * dist + side.y * off,
  });

  return (
    <g
      ref={ref}
      className={drifting ? 'drift-car-drifting' : undefined}
      transform={translateAttr({ x, y })}
    >
      {drifting && (
        <g aria-hidden="true">
          {[-SKID_SIDE, SKID_SIDE].flatMap((off) =>
            SKID_DISTANCES.map((dist) => {
              const c = at(dist, off);
              return (
                <rect
                  key={`${off}-${dist}`}
                  className="drift-skid"
                  x={c.x}
                  y={c.y}
                  width={PX}
                  height={PX}
                />
              );
            })
          )}
          {PUFFS.map((p, i) => {
            const c = at(p.back, p.side);
            return (
              <rect
                key={i}
                className="drift-smoke"
                x={snapToGrid(c.x - p.size / 2)}
                y={snapToGrid(c.y - p.size / 2)}
                width={p.size}
                height={p.size}
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            );
          })}
        </g>
      )}

      <g transform={`rotate(${directionAngle(facing)})`}>
        <g aria-hidden="true">
          {BEAMS.map((b, i) => (
            <rect key={i} className="drift-beam" x={b.x} y={b.y} width={b.w} height={PX} />
          ))}
        </g>
        {RUNS.map((run, i) => (
          <rect key={i} className={run.cls} x={run.x} y={run.y} width={run.w} height={PX} />
        ))}
      </g>
    </g>
  );
});

export default CarSprite;
