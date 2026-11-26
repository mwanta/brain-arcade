// The check-in form's values: strings from the inputs, '' when unanswered.
export const EMPTY_CHECK_IN = {
  hours_slept: '',
  caffeine_drinks: '',
  stress_level: '',
  exercised_today: '',
};

/**
 * Form values -> the body for POST /api/sessions/:id/check-in, keeping only the
 * questions that were answered.
 *
 * @returns {object | null} null when nothing was answered.
 */
export function toCheckIn(values) {
  const answers = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, key === 'exercised_today' ? value === 'yes' : Number(value)])
  );
  return Object.keys(answers).length ? answers : null;
}
