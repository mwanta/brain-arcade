import './drift.css';

/**
 * The end-of-game score, drawn as an overlay for the board stage (pass it to DriftLevel as
 * `finalOverlay`).
 *
 * @param {{
 *   total: { score: number, max_score: number, trials: number, mistakes: number,
 *     mean_rt_ms: number | null },
 *   onPlayAgain: () => void,
 * }} props `total` is from scoreSession.
 */
export default function DriftScore({ total, onPlayAgain }) {
  return (
    <div className="drift-overlay drift-score" role="status">
      <h2 className="drift-ready-title">Final score</h2>
      <p className="drift-score-total">
        {total.score}
        <span className="drift-score-max"> / {total.max_score}</span>
      </p>
      <p className="drift-score-line">
        Mistakes: {total.mistakes} of {total.trials}
      </p>
      <p className="drift-score-line">
        Average speed: {total.mean_rt_ms === null ? 'n/a' : `${total.mean_rt_ms} ms`}
      </p>
      <button
        type="button"
        className="drift-start"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onPlayAgain}
      >
        Play again
      </button>
    </div>
  );
}
