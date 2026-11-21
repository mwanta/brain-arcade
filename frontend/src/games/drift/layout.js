import { footprintsOverlap, sweptExtent } from './footprint.js';

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
 * Start positions for groups of identical cars such that no car's body, headlight beams, smoke
 * or skid marks come within a few units of another's, now or later.
 *
 * Cars in the same group drive together, so keeping their starting footprints apart is enough.
 * Cars in different groups drive along the same axis in opposite directions and pass each
 * other, so each group gets its own band across the road (in random order, wider for bigger
 * groups) and its cars are placed only inside it. Their lanes then never meet.
 *
 * @param {Array<{ footprint: import('./footprint.js').Rect[], count: number }>} groups The
 *   groups to place, each with one footprint (see carFootprint) shared by its cars.
 * @param {ReturnType<import('./random.js').createRng>} rng Seeded generator.
 * @param {number} size Board width and height.
 * @param {'x' | 'y'} axis The axis every car drives along.
 * @returns {Array<Array<{ x: number, y: number }>> | null} One list of positions per group, at
 *   least 50 from every edge, or null if they would not all fit within a bounded number of tries.
 */
export function layoutClear(groups, rng, size, axis) {
  const placed = groups.map(() => []);
  const active = rng.shuffle(groups.map((g, i) => ({ g, i })).filter(({ g }) => g.count > 0));
  const extents = active.map(({ g }) => sweptExtent(g.footprint, axis));
  const total = active.reduce((sum, { g }) => sum + g.count, 0);
  const needed = extents.reduce((sum, [lo, hi]) => sum + (hi - lo) + CLEAR_PAD, 0);
  const slack = Math.max(0, size - needed);

  let tries = 0;
  let start = 0; // where this group's band begins, across the road
  for (const [k, { g, i }] of active.entries()) {
    const [lo, hi] = extents[k];
    const width = hi - lo + CLEAR_PAD + (slack * g.count) / total;
    // Centres across the road that keep the whole footprint inside the band (and the car on the
    // board).
    const across = [
      Math.max(EDGE, start - lo),
      Math.min(size - EDGE, start + width - CLEAR_PAD - hi),
    ];
    start += width;
    if (across[0] > across[1]) return null;

    while (placed[i].length < g.count) {
      if (tries++ >= MAX_CLEAR_TRIES) return null;
      const along = EDGE + rng.next() * (size - 2 * EDGE);
      const side = across[0] + rng.next() * (across[1] - across[0]);
      const p = axis === 'y' ? { x: side, y: along } : { x: along, y: side };
      if (!placed[i].some((q) => footprintsOverlap(g.footprint, p, g.footprint, q, CLEAR_PAD))) {
        placed[i].push(p);
      }
    }
  }
  return placed;
}
