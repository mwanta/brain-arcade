const KEY_DIRECTIONS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/**
 * Map a KeyboardEvent.key to an answer direction.
 *
 * @param {string} key The `key` of a keyboard event.
 * @returns {string | null} 'up' | 'down' | 'left' | 'right' for arrow keys and WASD (either
 *   case), otherwise null.
 */
export function keyToDirection(key) {
  if (typeof key !== 'string') return null;
  const name = key.length === 1 ? key.toLowerCase() : key;
  return Object.hasOwn(KEY_DIRECTIONS, name) ? KEY_DIRECTIONS[name] : null;
}

/**
 * Turn a pointer drag into a direction. Screen y grows downward, so dy < 0 is up.
 *
 * @param {number} dx Horizontal travel in pixels.
 * @param {number} dy Vertical travel in pixels.
 * @param {number} [minDistance] Shortest travel along the dominant axis that counts.
 * @returns {string | null} The dominant axis's direction, or null if the drag is too short or
 *   exactly diagonal.
 */
export function swipeDirection(dx, dy, minDistance = 30) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax === ay || Math.max(ax, ay) < minDistance) return null;
  if (ax > ay) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}
