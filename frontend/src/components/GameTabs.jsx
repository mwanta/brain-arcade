// Tabs for picking one game. `games` comes from byGame(); renders nothing for a single game.
export default function GameTabs({ games, selectedId, onSelect }) {
  if (games.length < 2) return null;
  return (
    <div className="tabs" role="tablist">
      {games.map((g) => (
        <button
          key={g.gameId}
          type="button"
          role="tab"
          aria-selected={g.gameId === selectedId}
          className={g.gameId === selectedId ? 'tab active' : 'tab'}
          onClick={() => onSelect(g.gameId)}
        >
          {g.gameName}
        </button>
      ))}
    </div>
  );
}
