import PixelIcon from './PixelIcon.jsx';
import './drift.css';

const LABELS = { up: 'Up', down: 'Down', left: 'Left', right: 'Right' };

/**
 * Four on-screen arrow buttons in a cross layout. Presses register on pointer down, which
 * covers mouse, touch and pen with no click delay. The buttons are out of the tab order so a
 * focused button never swallows the arrow keys meant for the game.
 *
 * @param {{ onPress: (direction: string) => void, disabled?: boolean }} props
 */
export default function ArrowPad({ onPress, disabled = false }) {
  function handlePointerDown(direction, e) {
    if (e.button !== 0) return;
    // Stops the compatibility mouse events and click that would answer a second time, and keeps
    // focus where it is.
    e.preventDefault();
    if (!disabled) onPress(direction);
  }

  return (
    <div className="drift-pad" role="group" aria-label="Answer arrows">
      {['up', 'left', 'right', 'down'].map((direction) => (
        <button
          key={direction}
          type="button"
          className={`drift-pad-button drift-pad-${direction}`}
          aria-label={LABELS[direction]}
          tabIndex={-1}
          disabled={disabled}
          onPointerDown={(e) => handlePointerDown(direction, e)}
          onClick={(e) => e.preventDefault()}
        >
          <PixelIcon name={direction} size={32} />
        </button>
      ))}
    </div>
  );
}
