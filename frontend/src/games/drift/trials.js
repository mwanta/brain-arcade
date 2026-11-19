import { DIRECTIONS, otherDirections } from './directions.js';
import { createRng } from './random.js';

const STATES = ['drive', 'drift'];

/** The correct answer for a car: its facing if driving, its moving if drifting. */
function answerFor(car) {
  return car.state === 'drive' ? car.facing : car.moving;
}

/**
 * Generate every trial of a level, reproducibly.
 *
 * @param {ReturnType<import('./settings.js').parseLevelSettings>} settings Parsed settings.
 * @param {number} seed Integer seed; the same settings and seed give identical trials.
 * @returns {Array<{
 *   index: number,
 *   rule: 'drive' | 'drift',
 *   conflict: boolean,
 *   answer: string,
 *   targetIndex: number,
 *   cars: Array<{ state: 'drive' | 'drift', facing: string, moving: string, lit: boolean }>,
 * }>} trialCount trials. `rule` is the lit car's state; `conflict` is true when the lit
 *   car's facing differs from its moving direction.
 */
export function generateTrials(settings, seed) {
  const rng = createRng(seed);
  const { trialCount, switchProbability, carCount, conflictRatio, mixedTraffic } = settings;

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
    const moving = conflict ? rng.pick(otherDirections(facing)) : facing;
    const lit = { state: rule, facing, moving, lit: true };
    const answer = answerFor(lit);

    let cars;
    let targetIndex = 0;
    if (!mixedTraffic) {
      cars = Array.from({ length: carCount }, () => ({ ...lit }));
    } else {
      targetIndex = rng.int(0, carCount - 1);
      cars = [];
      for (let c = 0; c < carCount; c++) {
        if (c === targetIndex) {
          cars.push(lit);
          continue;
        }
        cars.push({
          state: rng.pick(STATES),
          facing: rng.pick(DIRECTIONS),
          moving: rng.pick(DIRECTIONS),
          lit: false,
        });
      }
      // Following the wrong car must cost points: force one distractor to disagree.
      const distractors = cars.map((_, i) => i).filter((i) => i !== targetIndex);
      if (!distractors.some((i) => answerFor(cars[i]) !== answer)) {
        const car = cars[rng.pick(distractors)];
        const wrong = rng.pick(otherDirections(answer));
        if (car.state === 'drive') car.facing = wrong;
        else car.moving = wrong;
      }
    }

    trials.push({ index, rule, conflict, answer, targetIndex, cars });
  }
  return trials;
}
