// Dimensions of a Drift car and its effects, in board units, shared by the sprite (which draws
// them) and the footprint maths (which keeps cars from overlapping). The car points up.

export const PX = 4; // one "pixel" of the art

// The car as pixel art, 8 x 12 pixels (32 x 48 units). Front is the top.
//   O outline   B body   S stripe   G windshield (pale)   R rear window (dark)
//   L headlamp  W wheel (sticks out at the sides)
export const ART = [
  '..OOOO..', // narrow nose
  '.OLBBLO.', // headlamps
  'WOBSSBOW', // hood, front wheels
  'WOGGGGOW', // windshield
  '.OGGGGO.',
  '.OBSSBO.', // roof
  '.OBSSBO.',
  'WOBSSBOW', // rear wheels
  'WORRRROW', // rear window
  '.OBSSBO.',
  'OBBBBBBO', // wide rear spoiler
  'OOOOOOOO',
];

export const CAR_WIDTH = ART[0].length * PX;
export const CAR_LENGTH = ART.length * PX;

// Headlight beams: stepped cones that widen ahead of each lamp, one pixel row at a time.
export const BEAM_ROWS = 6;

// Smoke puffs: square blocks behind the car, as { back, side, size } from its centre.
export const PUFFS = [
  { back: 32, side: -8, size: 8 },
  { back: 36, side: 8, size: 8 },
  { back: 48, side: -4, size: 12 },
  { back: 60, side: 8, size: 8 },
];

// Skid marks: PX-sized dashes at these distances behind the centre, SKID_SIDE either side of it.
export const SKID_SIDE = 12;
export const SKID_DISTANCES = [28, 36, 44, 52, 60, 68];
