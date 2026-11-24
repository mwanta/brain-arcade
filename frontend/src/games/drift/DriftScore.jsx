import PixelIcon from './PixelIcon.jsx';
import './drift.css';

const SAVE_TEXT = {
  saving: ['clock', 'Saving…'],
  saved: ['check', 'Saved to your stats'],
  error: ['cross', "Couldn't save your results"],
};

/**
 * The end-of-game result, drawn as an overlay for the board stage (pass it to DriftLevel as
 * `finalOverlay`).
 *
 * @param {{
 *   total: { levels_passed: number, total_levels: number, cleared: boolean, trials: number,
 *     mistakes: number, mean_rt_ms: number | null },
 *   onPlayAgain: () => void,
 *   saveStatus?: 'saving' | 'saved' | 'error',
 *   onRetrySave?: () => void,
 *   children?: ReactNode,
 * }} props `total` is from scoreSession; `children` are extra actions (e.g. a link to /stats).
 */
export default function DriftScore({ total, onPlayAgain, saveStatus, onRetrySave, children }) {
  const save = SAVE_TEXT[saveStatus];
  return (
    <div className="drift-overlay drift-score" role="status">
      <h2 className="drift-ready-title">
        {total.cleared ? 'All levels cleared!' : 'Out of lives'}
      </h2>
      <p className="drift-score-total">
        {total.levels_passed}
        <span className="drift-score-max"> / {total.total_levels}</span>
      </p>
      <p className="drift-score-line">Levels passed</p>
      <p className="drift-score-line">
        Mistakes: {total.mistakes} of {total.trials}
      </p>
      <p className="drift-score-line">
        Average speed: {total.mean_rt_ms === null ? 'n/a' : `${total.mean_rt_ms} ms`}
      </p>
      {save && (
        <p className="drift-score-line drift-score-save">
          <PixelIcon name={save[0]} size={24} /> {save[1]}
          {saveStatus === 'error' && onRetrySave && (
            <>
              {' '}
              <button
                type="button"
                className="drift-start"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onRetrySave}
              >
                Retry
              </button>
            </>
          )}
        </p>
      )}
      <div className="drift-score-actions">
        <button
          type="button"
          className="drift-start"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onPlayAgain}
        >
          Play again
        </button>
        {children}
      </div>
    </div>
  );
}
