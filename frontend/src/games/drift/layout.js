import { footprintsOverlap } from './footprint.js';

const EDGE = 50; // keep car centres this far from every board edge
const GAPS = [70, 60, 56]; // preferred centre-to-centre spacing, relaxed if the board is crowded
const MAX_TRIES = 2000;
const MAX_CLEAR_TRIES = 30000;
const CLEAR_PAD = 8; // clearance between footprints; also absorbs the 4-unit pixel snapping

/** Evenly spread grid inside the edge margin; the fallback when sampling runs out of tries. */
function spreadGrid(count, size) {
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const span = size - 2 * EDGE;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    positions.push({
      x: columns === 1 ? size / 2 : EDGE + (col * span) / (columns - 1),
      y: rows === 1 ? size / 2 : EDGE + (row * span) / (rows - 1),
    });
  }
  return positions;
}

/** Rejection-sample scattered positions at least `gap` apart; null if the tries run out. */
function scatter(count, gap, rng, size) {
  const positions = [];
  let tries = 0;
  while (positions.length < count) {
    if (tries++ >= MAX_TRIES) return null;
    const p = {
      x: EDGE + rng.next() * (size - 2 * EDGE),
      y: EDGE + rng.next() * (size - 2 * EDGE),
    };
    const clear = positions.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= gap);
    if (clear) positions.push(p);
  }
  return positions;
}

/**
 * Start positions for a board's cars, spread out across the whole board.
 *
 * Positions are scattered by rejection sampling with the rng (bounded tries): at least 50 from
 * every edge and 70 apart. If the board is too crowded for that, the spacing is relaxed to 60,
 * then 56, and finally the cars go on an evenly spread grid.
 *
 * @param {number} carCount Number of cars to place.
 * @param {ReturnType<import('./random.js').createRng>} rng Seeded generator.
 * @param {number} [size=400] Board width and height.
 * @returns {Array<{ x: number, y: number }>} carCount positions; deterministic for a seed.
 */
export function layoutCars(carCount, rng, size = 400) {
  for (const gap of GAPS) {
    const positions = scatter(carCount, gap, rng, size);
    if (positions) return positions;
  }
  return spreadGrid(carCount, size);
}

/**
 * Start positions for identical cars such that no car's body, headlight beams, smoke or skid
 * marks come within a few units of another's. Cars all move together, so once they start clear
 * of each other they stay clear (a car that wraps does so off-screen).
 *
 * @param {number} carCount Number of cars to place.
 * @param {ReturnType<import('./random.js').createRng>} rng Seeded generator.
 * @param {number} size Board width and height.
 * @param {import('./footprint.js').Rect[]} footprint One car's footprint (see carFootprint).
 * @returns {Array<{ x: number, y: number }> | null} carCount positions, at least 50 from every
 *   edge, or null if they would not fit within a bounded number of tries.
 */
export function layoutClear(carCount, rng, size, footprint) {
  const positions = [];
  let tries = 0;
  while (positions.length < carCount) {
    if (tries++ >= MAX_CLEAR_TRIES) return null;
    const p = {
      x: EDGE + rng.next() * (size - 2 * EDGE),
      y: EDGE + rng.next() * (size - 2 * EDGE),
    };
    if (!positions.some((q) => footprintsOverlap(footprint, p, q, CLEAR_PAD))) positions.push(p);
  }
  return positions;
}
