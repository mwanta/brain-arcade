/** The four answer directions, in a fixed order. */
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

/**
 * The directions other than the given one.
 *
 * @param {string} dir One of DIRECTIONS.
 * @returns {string[]} The other three directions.
 */
export function otherDirections(dir) {
  return DIRECTIONS.filter((d) => d !== dir);
}
