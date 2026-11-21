import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import CarSprite from './CarSprite.jsx';
import { carFootprint } from './footprint.js';
import { advance, translateAttr } from './geometry.js';
import { layoutCars, layoutClear } from './layout.js';
import { createRng } from './random.js';
import './drift.css';

const SIZE = 600;
// Each trial car is drawn several times (look-alikes copy its facing, moving and state), so the
// board is full of cars. Sprites are scattered across the board so that no car's headlights,
// smoke or skid marks overlap another's; if that many do not fit, fewer are drawn.
const SPRITES_PER_CAR = 4;
// A car wraps once it is this far past an edge, which keeps it (and its beams and smoke) fully
// off-screen when it reappears on the other side.
const WRAP_MARGIN = 80;
// Cap one frame's dt so a backgrounded tab doesn't make cars jump on return.
const MAX_FRAME_MS = 100;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function describeCars(trial, perCar) {
  const car = trial.cars[0];
  const subject = `${trial.cars.length * perCar} identical cars`;
  const verb = car.state === 'drift' ? 'drifting' : 'driving';
  return `${subject} facing ${car.facing}, ${verb} ${car.moving}`;
}

/**
 * The road and a trial's cars, all identical and all scattered across the board. Positions live in a ref and are written straight to each sprite's SVG transform every
 * frame, snapped to the pixel grid, so React does not re-render the tree while animating.
 *
 * @param {{
 *   trial: { cars: Array<{ state: string, facing: string, moving: string }> },
 *   moveSpeed: number, running: boolean, seed: number,
 * }} props `moveSpeed` is in board units per second; `seed` picks the start layout.
 */
export default function DriftBoard({ trial, moveSpeed, running, seed }) {
  const patternId = `drift-road-${useId().replace(/:/g, '')}`;
  const reducedMotion = usePrefersReducedMotion();

  // Start positions where no car's body, beams or trail overlaps another's. The cars are all
  // identical, so one footprint covers them. Try SPRITES_PER_CAR look-alikes per car, then fewer.
  const layout = useMemo(() => {
    const first = trial.cars[0];
    const footprint = carFootprint(first.facing, first.moving, first.state === 'drift');
    for (let perCar = SPRITES_PER_CAR; perCar >= 1; perCar--) {
      const starts = layoutClear(trial.cars.length * perCar, createRng(seed), SIZE, footprint);
      if (starts) return { perCar, starts };
    }
    return { perCar: 1, starts: layoutCars(trial.cars.length, createRng(seed), SIZE) };
  }, [trial, seed]);
  const { starts } = layout;

  // One entry per sprite: each trial car, repeated perCar times.
  const sprites = useMemo(
    () =>
      trial.cars.flatMap((car, i) =>
        Array.from({ length: layout.perCar }, (_, k) => ({ id: i * layout.perCar + k, car }))
      ),
    [trial, layout.perCar]
  );
  const positions = useRef(starts.map((p) => ({ ...p })));
  const nodes = useRef([]); // nodes.current[sprite id]

  // A new trial (or layout) resets every car to its start position.
  useLayoutEffect(() => {
    positions.current = starts.map((p) => ({ ...p }));
    positions.current.forEach((p, id) => {
      nodes.current[id]?.setAttribute('transform', translateAttr(p));
    });
  }, [starts]);

  useEffect(() => {
    if (!running) return undefined;
    const speed = reducedMotion ? moveSpeed / 2 : moveSpeed;
    let last = null;
    let frame = requestAnimationFrame(function tick(now) {
      const dt = last === null ? 0 : Math.min(now - last, MAX_FRAME_MS);
      last = now;
      for (const { id, car } of sprites) {
        const next = advance(positions.current[id], car.moving, speed, dt, SIZE, WRAP_MARGIN);
        positions.current[id] = next;
        nodes.current[id]?.setAttribute('transform', translateAttr(next));
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [sprites, running, moveSpeed, reducedMotion]);

  const label = describeCars(trial, layout.perCar);

  return (
    <svg
      className="drift-board"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <defs>
        <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect className="drift-speckle" x="4" y="4" width="4" height="4" />
          <rect className="drift-speckle" x="12" y="10" width="4" height="4" />
        </pattern>
      </defs>
      <rect className="drift-road" width={SIZE} height={SIZE} />
      <rect width={SIZE} height={SIZE} fill={`url(#${patternId})`} />
      <g aria-hidden="true">
        {[102, 202, 302, 402, 502].map((n) => (
          <g key={n}>
            <line className="drift-lane" x1={n} y1="0" x2={n} y2={SIZE} />
            <line className="drift-lane" x1="0" y1={n} x2={SIZE} y2={n} />
          </g>
        ))}
      </g>
      {sprites.map(({ id, car }) => (
        <CarSprite
          key={id}
          ref={(node) => {
            nodes.current[id] = node;
          }}
          x={starts[id].x}
          y={starts[id].y}
          facing={car.facing}
          moving={car.moving}
          state={car.state}
        />
      ))}
    </svg>
  );
}
