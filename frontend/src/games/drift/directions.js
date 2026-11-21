/** The four answer directions, in a fixed order. */
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

const OPPOSITES = { up: 'down', down: 'up', left: 'right', right: 'left' };

/**
 * The direction pointing the other way.
 *
 * @param {string} dir One of DIRECTIONS.
 * @returns {string} The opposite direction.
 */
export function oppositeDirection(dir) {
  if (!Object.hasOwn(OPPOSITES, dir)) throw new Error(`Unknown direction "${dir}"`);
  return OPPOSITES[dir];
}

/**
 * The directions other than the given one.
 *
 * @param {string} dir One of DIRECTIONS.
 * @returns {string[]} The other three directions.
 */
export function otherDirections(dir) {
  return DIRECTIONS.filter((d) => d !== dir);
}
