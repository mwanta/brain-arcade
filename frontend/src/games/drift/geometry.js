/** Rotation, in degrees, of a car drawn pointing up so that it points in `dir`. */
const ANGLES = { up: 0, right: 90, down: 180, left: 270 };

/** Unit vectors in SVG coordinates, where y grows downward. */
const VECTORS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

function assertDirection(dir) {
  if (!Object.hasOwn(ANGLES, dir)) {
    throw new Error(`Unknown direction "${dir}"`);
  }
}

/**
 * Degrees of clockwise rotation for a car drawn pointing up.
 *
 * @param {'up' | 'down' | 'left' | 'right'} dir Direction the car should point.
 * @returns {number} 0, 90, 180 or 270.
 * @throws {Error} For an unknown direction.
 */
export function directionAngle(dir) {
  assertDirection(dir);
  return ANGLES[dir];
}

/**
 * Unit vector for a direction, in SVG coordinates (y grows downward).
 *
 * @param {'up' | 'down' | 'left' | 'right'} dir A direction.
 * @returns {{ x: number, y: number }} A new vector; up is { x: 0, y: -1 }.
 * @throws {Error} For an unknown direction.
 */
export function directionVector(dir) {
  assertDirection(dir);
  return { ...VECTORS[dir] };
}

/** Wrap one coordinate into [-margin, size + margin] if it is strictly outside it. */
function wrap(value, size, margin) {
  const low = -margin;
  const high = size + margin;
  if (value >= low && value <= high) return value;
  const span = size + 2 * margin;
  return ((((value - low) % span) + span) % span) + low;
}

/**
 * Move a position along a direction, wrapping at the board edges.
 *
 * A car that ends up more than `margin` past an edge reappears the same distance
 * past the opposite edge, so it drives off one side and back on the other.
 *
 * @param {{ x: number, y: number }} pos Current position.
 * @param {'up' | 'down' | 'left' | 'right'} dir Direction of travel.
 * @param {number} speed Board units per second.
 * @param {number} dtMs Elapsed time in milliseconds.
 * @param {number} [size=400] Board width and height.
 * @param {number} [margin=30] How far past an edge a car may be before it wraps.
 * @returns {{ x: number, y: number }} The new position (the input is not mutated).
 */
export function advance(pos, dir, speed, dtMs, size = 400, margin = 30) {
  const v = directionVector(dir);
  const distance = (speed * dtMs) / 1000;
  return {
    x: wrap(pos.x + v.x * distance, size, margin),
    y: wrap(pos.y + v.y * distance, size, margin),
  };
}

/**
 * Round a coordinate to the pixel grid, for chunky retro movement.
 *
 * @param {number} value A board coordinate.
 * @param {number} [step=4] Pixel size in board units.
 * @returns {number} The nearest multiple of step.
 */
export function snapToGrid(value, step = 4) {
  return Math.round(value / step) * step;
}

/**
 * SVG transform that places something at a position, snapped to the pixel grid.
 *
 * @param {{ x: number, y: number }} pos Board position.
 * @returns {string} A `translate(x y)` transform value.
 */
export function translateAttr(pos) {
  return `translate(${snapToGrid(pos.x)} ${snapToGrid(pos.y)})`;
}
