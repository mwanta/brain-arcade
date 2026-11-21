import {
  BEAM_ROWS,
  CAR_LENGTH,
  CAR_WIDTH,
  PUFFS,
  PX,
  SKID_DISTANCES,
  SKID_SIDE,
} from './carShape.js';
import { directionAngle, directionVector } from './geometry.js';

/** @typedef {{ x0: number, y0: number, x1: number, y1: number }} Rect */

/** Rotate a rect about the origin by a multiple of 90 degrees (SVG rotate: clockwise). */
function rotateRect(r, degrees) {
  const turns = (((degrees / 90) % 4) + 4) % 4;
  let { x0, y0, x1, y1 } = r;
  for (let i = 0; i < turns; i++) {
    // (x, y) -> (-y, x)
    [x0, y0, x1, y1] = [-y1, x0, -y0, x1];
  }
  return { x0, y0, x1, y1 };
}

/** The bounding rect of two points. */
function span(ax, ay, bx, by) {
  return { x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by) };
}

/**
 * The board area a car occupies, relative to its centre, as a few axis-aligned rects: the body,
 * the headlight beams ahead of it, and (when drifting) the smoke and skid marks behind the
 * direction it is moving. Rects are conservative bounding boxes, so cars kept apart by them
 * never have overlapping bodies, beams or trails.
 *
 * @param {'up' | 'down' | 'left' | 'right'} facing Direction the front points.
 * @param {'up' | 'down' | 'left' | 'right'} moving Direction of travel.
 * @param {boolean} drifting Whether the car leaves smoke and skid marks.
 * @param {boolean} [lit=true] Whether its headlights are on (grey distractor cars have none).
 * @returns {Rect[]} The body, plus beams when lit and a trail when drifting.
 */
export function carFootprint(facing, moving, drifting, lit = true) {
  const angle = directionAngle(facing);
  const halfW = CAR_WIDTH / 2;
  const halfL = CAR_LENGTH / 2;
  const beamHalfW = (BEAM_ROWS + 1) * PX;

  const rects = [rotateRect({ x0: -halfW, y0: -halfL, x1: halfW, y1: halfL }, angle)];
  if (lit) {
    rects.push(
      rotateRect({ x0: -beamHalfW, y0: -halfL - BEAM_ROWS * PX, x1: beamHalfW, y1: -halfL }, angle)
    );
  }

  if (drifting) {
    const travel = directionVector(moving);
    const back = { x: -travel.x, y: -travel.y };
    const side = { x: -back.y, y: back.x };
    const lateral = SKID_SIDE + PX; // skid dashes are the widest part of the trail
    const reach = Math.max(
      SKID_DISTANCES[SKID_DISTANCES.length - 1] + PX,
      ...PUFFS.map((p) => p.back + p.size / 2)
    );
    // Opposite corners of the trail box: near the car on one side, far away on the other.
    const ax = back.x * halfL + side.x * lateral;
    const ay = back.y * halfL + side.y * lateral;
    const bx = back.x * reach - side.x * lateral;
    const by = back.y * reach - side.y * lateral;
    rects.push(span(ax, ay, bx, by));
  }
  return rects;
}

/**
 * Whether two cars' footprints, with centres at `a` and `b`, come within `pad` of each other.
 *
 * @param {Rect[]} fa Footprint of the car centred at `a`.
 * @param {{ x: number, y: number }} a First centre.
 * @param {Rect[]} fb Footprint of the car centred at `b`.
 * @param {{ x: number, y: number }} b Second centre.
 * @param {number} [pad=0] Extra clearance required between any two rects.
 * @returns {boolean} True if any rect of one is within pad of any rect of the other.
 */
export function footprintsOverlap(fa, a, fb, b, pad = 0) {
  return fa.some((r) =>
    fb.some(
      (s) =>
        a.x + r.x0 < b.x + s.x1 + pad &&
        b.x + s.x0 < a.x + r.x1 + pad &&
        a.y + r.y0 < b.y + s.y1 + pad &&
        b.y + s.y0 < a.y + r.y1 + pad
    )
  );
}

/**
 * The sideways band a car sweeps out while driving along an axis forever.
 *
 * @param {Rect[]} footprint The car's footprint.
 * @param {'x' | 'y'} axis The axis it drives along.
 * @returns {[number, number]} [low, high] of the footprint across the other axis.
 */
export function sweptExtent(footprint, axis) {
  const lo = axis === 'x' ? 'y0' : 'x0';
  const hi = axis === 'x' ? 'y1' : 'x1';
  return [Math.min(...footprint.map((r) => r[lo])), Math.max(...footprint.map((r) => r[hi]))];
}

/**
 * Whether two cars driving along the same axis, possibly in opposite directions, will ever
 * come within `pad` of each other: they do if their sideways bands overlap, because one then
 * drives through the other's lane.
 *
 * @param {Rect[]} fa Footprint of the car centred at `a`.
 * @param {{ x: number, y: number }} a First centre.
 * @param {Rect[]} fb Footprint of the car centred at `b`.
 * @param {{ x: number, y: number }} b Second centre.
 * @param {'x' | 'y'} axis The axis both cars drive along.
 * @param {number} [pad=0] Extra clearance required between the bands.
 * @returns {boolean} True if the sideways bands come within pad of each other.
 */
export function sweptOverlap(fa, a, fb, b, axis, pad = 0) {
  const [alo, ahi] = sweptExtent(fa, axis);
  const [blo, bhi] = sweptExtent(fb, axis);
  const ac = axis === 'x' ? a.y : a.x;
  const bc = axis === 'x' ? b.y : b.x;
  return ac + alo < bc + bhi + pad && bc + blo < ac + ahi + pad;
}
