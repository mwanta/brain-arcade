import { iconPixels } from './pixelIcons.js';

/**
 * A pixel-art icon drawn as square SVG cells that take the current text colour.
 *
 * @param {{ name: string, size?: number }} props `name` is a key of PIXEL_ICONS; `size` is the
 *   width and height in px.
 */
export default function PixelIcon({ name, size = 96 }) {
  return (
    <svg
      className="drift-pixel-icon"
      viewBox="0 0 8 8"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      {iconPixels(name).map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  );
}
