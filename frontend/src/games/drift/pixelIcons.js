// 8x8 pixel-art icons as rows of '#' (filled) and '.' (empty).
const UP = [
  '...##...',
  '..####..',
  '.######.',
  '########',
  '...##...',
  '...##...',
  '...##...',
  '...##...',
];

function rotateRight(rows) {
  return rows[0].split('').map((_, x) =>
    rows
      .map((row) => row[x])
      .reverse()
      .join('')
  );
}

const RIGHT = rotateRight(UP);
const DOWN = rotateRight(RIGHT);
const LEFT = rotateRight(DOWN);

export const PIXEL_ICONS = {
  check: [
    '........',
    '......##',
    '.....##.',
    '#...##..',
    '##.##...',
    '.###....',
    '..#.....',
    '........',
  ],
  cross: [
    '##....##',
    '###..###',
    '.######.',
    '..####..',
    '..####..',
    '.######.',
    '###..###',
    '##....##',
  ],
  clock: [
    '..####..',
    '.#....#.',
    '#..#...#',
    '#..#...#',
    '#..###.#',
    '#......#',
    '.#....#.',
    '..####..',
  ],
  heart: [
    '.##..##.',
    '########',
    '########',
    '########',
    '.######.',
    '..####..',
    '...##...',
    '........',
  ],
  'heart-empty': [
    '.##..##.',
    '#..##..#',
    '#......#',
    '#......#',
    '.#....#.',
    '..#..#..',
    '...##...',
    '........',
  ],
  up: UP,
  down: DOWN,
  left: LEFT,
  right: RIGHT,
};

/**
 * The filled cells of an icon.
 *
 * @param {string} name A key of PIXEL_ICONS.
 * @returns {Array<{ x: number, y: number }>} Cell coordinates, 0-7.
 */
export function iconPixels(name) {
  if (!Object.hasOwn(PIXEL_ICONS, name)) throw new Error(`Unknown icon "${name}"`);
  const cells = [];
  PIXEL_ICONS[name].forEach((row, y) =>
    row.split('').forEach((ch, x) => {
      if (ch === '#') cells.push({ x, y });
    })
  );
  return cells;
}
