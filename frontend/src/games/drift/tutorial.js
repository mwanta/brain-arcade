import { oppositeDirection } from './directions.js';
import { SESSION_LEVELS, STARTING_LIVES, TRIALS_PER_LEVEL } from './session.js';
import { answerFor } from './trials.js';

// A hand-built trial in the same shape as generateTrials' output. The answer, rule and conflict
// come from the cars, so they can never disagree with the rules of the game.
function makeTrial(index, cars, distractors = []) {
  const first = cars[0];
  return {
    index,
    rule: first.state,
    conflict: first.facing !== first.moving,
    answer: answerFor(first),
    cars,
    distractors,
  };
}

const car = (state, facing, moving) => ({ state, facing, moving });
const cars = (count, state, facing, moving) =>
  Array.from({ length: count }, () => car(state, facing, moving));
// Grey cars drive opposite to the cars to follow, as trials.js lays them out.
const greyCars = (count, moving) =>
  Array.from({ length: count }, () =>
    car('drive', oppositeDirection(moving), oppositeDirection(moving))
  );

// Slow, so the movement (and a car reversing) is easy to see.
const TUTORIAL_SPEED = 40;

/**
 * The how-to-play steps, in order. `trial` is shown on an animated board; steps without an
 * answer to teach (the last) use it only as a backdrop.
 */
export const TUTORIAL_STEPS = [
  {
    title: 'Driving',
    text: 'Red cars are driving, so swipe the way they MOVE.',
    trial: makeTrial(0, cars(2, 'drive', 'up', 'up')),
    moveSpeed: TUTORIAL_SPEED,
  },
  {
    title: 'Reversing',
    text: 'Driving cars sometimes reverse: they face one way but move the other. Still swipe the way they MOVE.',
    trial: makeTrial(1, cars(2, 'drive', 'up', 'down')),
    moveSpeed: TUTORIAL_SPEED,
  },
  {
    title: 'Drifting',
    text: 'Blue cars with tire smoke are drifting, so swipe the way they FACE, not the way they move.',
    trial: makeTrial(2, cars(2, 'drift', 'left', 'up')),
    moveSpeed: TUTORIAL_SPEED,
  },
  {
    title: 'Grey cars',
    text: 'Grey cars have no headlights. They are distractors, so ignore them and follow the colored cars.',
    trial: makeTrial(3, cars(2, 'drive', 'right', 'right'), greyCars(2, 'right')),
    moveSpeed: TUTORIAL_SPEED,
  },
  {
    title: 'Controls and lives',
    text: `Click the arrows, use the arrow keys, or swipe the board. A game is ${SESSION_LEVELS} levels of ${TRIALS_PER_LEVEL} rounds, with ${STARTING_LIVES} lives for the whole game. Your score is how many levels you pass.`,
    trial: makeTrial(4, cars(1, 'drive', 'up', 'up')),
    moveSpeed: TUTORIAL_SPEED,
  },
];
