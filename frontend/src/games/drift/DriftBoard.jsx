import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import CarSprite from './CarSprite.jsx';
import { carFootprint } from './footprint.js';
import { advance, translateAttr } from './geometry.js';
import { layoutCars, layoutClear } from './layout.js';
import { createRng } from './random.js';
import './drift.css';

const SIZE = 600;
// Cars are scattered across the board so that no car's headlights, smoke or skid marks overlap
// another's, now or as they drive past each other. If a level's cars do not all fit, fewer are
// drawn.
const FALLBACK_SCALES = [0.75, 0.5, 0.25];
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

function describeCars(trial, cars, grey) {
  const car = trial.cars[0];
  const verb = car.state === 'drift' ? 'drifting' : 'driving';
  const subject = cars === 1 ? 'Car' : `${cars} identical cars`;
  const extra = grey > 0 ? `, with ${grey} grey cars driving ${trial.distractors[0].moving}` : '';
  return `${subject} facing ${car.facing}, ${verb} ${car.moving}${extra}`;
}

/**
 * The road, the cars to follow (all identical) and any grey distractor cars, scattered across
 * the board. Positions live in a ref and are written straight to each sprite's SVG transform
 * every frame, snapped to the pixel grid, so React does not re-render the tree while animating.
 *
 * @param {{
 *   trial: {
 *     cars: Array<{ state: string, facing: string, moving: string }>,
 *     distractors?: Array<{ state: string, facing: string, moving: string }>,
 *   },
 *   moveSpeed: number, running: boolean, seed: number, showCars?: boolean,
 * }} props `moveSpeed` is in board units per second; `seed` picks the start layout. With
 *   `showCars` false (default true) the road is drawn empty.
 */
export default function DriftBoard({ trial, moveSpeed, running, seed, showCars = true }) {
  const patternId = `drift-road-${useId().replace(/:/g, '')}`;
  const reducedMotion = usePrefersReducedMotion();

  // Start positions where no car's body, beams or trail overlaps another's, now or later. The
  // cars to follow and the grey distractors drive opposite ways along one axis, so each group
  // gets its own band across the road (see layoutClear).
  const layout = useMemo(() => {
    const target = trial.cars[0];
    const distractors = trial.distractors ?? [];
    const axis = target.moving === 'up' || target.moving === 'down' ? 'y' : 'x';
    const footprint = carFootprint(target.facing, target.moving, target.state === 'drift');
    const grey = distractors[0];
    const greyFootprint = grey ? carFootprint(grey.facing, grey.moving, false, false) : footprint;
    for (const scale of [1, ...FALLBACK_SCALES]) {
      const cars = Math.max(1, Math.ceil(trial.cars.length * scale));
      const greyCars = Math.ceil(distractors.length * scale);
      const placed = layoutClear(
        [
          { footprint, count: cars },
          { footprint: greyFootprint, count: greyCars },
        ],
        createRng(seed),
        SIZE,
        axis
      );
      if (placed) return { cars, greyCars, starts: [...placed[0], ...placed[1]] };
    }
    const cars = trial.cars.length;
    return { cars, greyCars: 0, starts: layoutCars(cars, createRng(seed), SIZE) };
  }, [trial, seed]);
  const { starts } = layout;

  // One entry per sprite: the cars to follow first, then the grey distractors.
  const sprites = useMemo(
    () => [
      ...trial.cars.slice(0, layout.cars).map((car, id) => ({ id, car, distractor: false })),
      ...(trial.distractors ?? []).slice(0, layout.greyCars).map((car, j) => ({
        id: layout.cars + j,
        car,
        distractor: true,
      })),
    ],
    [trial, layout.cars, layout.greyCars]
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

  const label = describeCars(trial, layout.cars, layout.greyCars);

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
        {[100, 200, 300, 400, 500].map((n) => (
          <g key={n}>
            <line className="drift-lane" x1={n} y1="0" x2={n} y2={SIZE} />
            <line className="drift-lane" x1="0" y1={n} x2={SIZE} y2={n} />
          </g>
        ))}
      </g>
      {showCars &&
        [...sprites].reverse().map(({ id, car, distractor }) => (
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
            distractor={distractor}
          />
        ))}
    </svg>
  );
}
