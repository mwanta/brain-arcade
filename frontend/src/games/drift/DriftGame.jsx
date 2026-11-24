import { useMemo, useRef, useState } from 'react';
import DriftLevel from './DriftLevel.jsx';
import {
  SESSION_LEVELS,
  STARTING_LIVES,
  livesAfter,
  scoreSession,
  sessionLevelSettings,
} from './session.js';

const freshGame = (run, index = 0) => ({
  run,
  index, // position in `levels` of the level on screen
  lives: STARTING_LIVES, // lives at the start of that level
  finished: [], // [{ results, settings }] in play order
  over: false,
});

/**
 * One whole game of Drift: up to SESSION_LEVELS levels in order, sharing STARTING_LIVES lives.
 * The game ends when the last life is lost (mid-level) or after the last level; the last board
 * then stays on screen with renderFinal(...) over it.
 *
 * @param {{
 *   levels: Array<{ levelId: number, levelNumber: number, raw: object }>,
 *   seed: number,
 *   onLevelComplete?: (done: { level: object, results: Array<object>, settings: object,
 *     livesLeft: number }) => void,
 *   onGameOver?: (total: object) => void,
 *   renderFinal: (total: object, playAgain: () => void) => ReactNode,
 *   allowJump?: boolean,
 * }} props `onLevelComplete` gets the lives left AFTER the level; `onGameOver` gets
 *   scoreSession's result, once.
 */
export default function DriftGame({
  levels,
  seed,
  onLevelComplete,
  onGameOver,
  renderFinal,
  allowJump = false,
}) {
  const [game, setGame] = useState(() => freshGame(0));
  // Always the latest state, so a level that completes reads the lives it started with.
  const gameRef = useRef(game);
  gameRef.current = game;

  const level = levels[game.index];
  const settings = useMemo(() => sessionLevelSettings(level.raw, game.lives), [level, game.lives]);

  function handleComplete({ results }) {
    const current = gameRef.current;
    const livesLeft = livesAfter(current.lives, results);
    const finished = [...current.finished, { results, settings }];
    const over = livesLeft === 0 || current.index === SESSION_LEVELS - 1;
    onLevelComplete?.({ level, results, settings, livesLeft });
    if (over) {
      setGame({ ...current, finished, over: true });
      onGameOver?.(scoreSession(finished));
    } else {
      setGame({ ...current, index: current.index + 1, lives: livesLeft, finished });
    }
  }

  function playAgain() {
    setGame((g) => freshGame(g.run + 1));
  }

  function jumpTo(index) {
    setGame((g) => freshGame(g.run + 1, index));
  }

  return (
    <div>
      {allowJump && (
        <p>
          <label>
            Jump to level (dev){' '}
            <select value={game.index} onChange={(e) => jumpTo(Number(e.target.value))}>
              {levels.map((l, i) => (
                <option key={l.levelId} value={i}>
                  Level {l.levelNumber}
                </option>
              ))}
            </select>
          </label>
        </p>
      )}
      <DriftLevel
        key={`${game.run}-${level.levelNumber}`}
        title={`Level ${level.levelNumber} of ${SESSION_LEVELS}`}
        settings={settings}
        lives={game.lives}
        seed={seed + level.levelNumber * 1000}
        finalOverlay={game.over && renderFinal(scoreSession(game.finished), playAgain)}
        onComplete={handleComplete}
      />
    </div>
  );
}
