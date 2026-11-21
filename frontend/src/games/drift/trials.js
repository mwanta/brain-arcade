import { DIRECTIONS, oppositeDirection, otherDirections } from './directions.js';
import { createRng } from './random.js';

const STATES = ['drive', 'drift'];

/**
 * The correct answer for a car: the way it moves if driving, the way it faces if drifting.
 * A driving car only goes forward or in reverse, so its moving direction is its facing or the
 * opposite; a drifting car (smoke and skid marks) can slide any way.
 */
function answerFor(car) {
  return car.state === 'drive' ? car.moving : car.facing;
}

/** Moving direction for a car that must (or must not) differ from its facing. */
function movingFor(state, facing, differs, rng) {
  if (!differs) return facing;
  return state === 'drive' ? oppositeDirection(facing) : rng.pick(otherDirections(facing));
}

/**
 * Generate every trial of a level, reproducibly.
 *
 * Every car in a trial is identical and every car is a target, so following any of them gives
 * the answer. (The level's `mixedTraffic` setting is ignored.)
 *
 * @param {ReturnType<import('./settings.js').parseLevelSettings>} settings Parsed settings.
 * @param {number} seed Integer seed; the same settings and seed give identical trials.
 * @returns {Array<{
 *   index: number,
 *   rule: 'drive' | 'drift',
 *   conflict: boolean,
 *   answer: string,
 *   cars: Array<{ state: 'drive' | 'drift', facing: string, moving: string }>,
 * }>} trialCount trials. `rule` is the cars' state; `conflict` is true when their facing differs
 *   from their moving direction.
 */
export function generateTrials(settings, seed) {
  const rng = createRng(seed);
  const { trialCount, switchProbability, carCount, conflictRatio } = settings;

  const conflictCount = Math.round(trialCount * conflictRatio);
  const conflictFlags = rng.shuffle(
    Array.from({ length: trialCount }, (_, i) => i < conflictCount)
  );

  const trials = [];
  let rule = rng.pick(STATES);
  for (let index = 0; index < trialCount; index++) {
    if (index > 0 && rng.chance(switchProbability)) {
      rule = rule === 'drive' ? 'drift' : 'drive';
    }
    const conflict = conflictFlags[index];
    const facing = rng.pick(DIRECTIONS);
    const moving = movingFor(rule, facing, conflict, rng);
    const car = { state: rule, facing, moving };
    const cars = Array.from({ length: carCount }, () => ({ ...car }));

    trials.push({ index, rule, conflict, answer: answerFor(car), cars });
  }
  return trials;
}
