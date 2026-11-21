// Drift levels 1-10 as the API will return them, copied from backend/database/seed.sql.
// [time_limit, max_errors, trial_count, switch_probability, car_count, move_speed,
//  conflict_ratio, distractor_count]
const ROWS = [
  [3000, 4, 20, 0.2, 3, 60, 0.3, 0],
  [2800, 4, 20, 0.25, 4, 70, 0.35, 0],
  [2600, 4, 24, 0.3, 6, 80, 0.4, 0],
  [2400, 3, 24, 0.35, 8, 90, 0.45, 0],
  [2200, 3, 28, 0.4, 10, 100, 0.5, 0],
  [2600, 4, 24, 0.4, 3, 50, 0.5, 2],
  [2400, 4, 28, 0.45, 4, 70, 0.55, 3],
  [2200, 3, 28, 0.5, 5, 90, 0.6, 4],
  [2000, 3, 32, 0.55, 6, 110, 0.65, 5],
  [1800, 2, 32, 0.6, 8, 130, 0.7, 6],
];

/** Raw (snake_case) settings keyed by level number, 1-10. */
export const LEVELS = Object.fromEntries(
  ROWS.map(
    (
      [
        time_limit,
        max_errors,
        trial_count,
        switch_probability,
        car_count,
        move_speed,
        conflict_ratio,
        distractor_count,
      ],
      i
    ) => [
      i + 1,
      {
        trial_count,
        time_limit,
        max_errors,
        switch_probability,
        car_count,
        move_speed,
        conflict_ratio,
        distractor_count,
      },
    ]
  )
);
