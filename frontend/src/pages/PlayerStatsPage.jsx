import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPlayer } from '../api/playersApi.js';
import { getGameSummaries } from '../api/statsApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PlayerStatsHeader from '../components/PlayerStatsHeader.jsx';
import CohortFilters from '../components/CohortFilters.jsx';
import CohortComparison from '../components/CohortComparison.jsx';
import ScoreDistribution from '../components/ScoreDistribution.jsx';
import DemographicBreakdown from '../components/DemographicBreakdown.jsx';
import LearningCurve from '../components/LearningCurve.jsx';
import ConditionImpact from '../components/ConditionImpact.jsx';
import LevelPerformance from '../components/LevelPerformance.jsx';
import { readFilters, writeFilters } from '../components/cohortFilters.js';

// Stats for the logged-in player, whose ID is passed down from <RequireLogin>.
export default function PlayerStatsPage({ playerId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayer(playerId).then(setPlayer).catch(setError);
    // The games this player has finished a play of: the cohort stats only cover those.
    getGameSummaries(playerId)
      .then((rows) => setGames(rows.map((g) => ({ game_id: g.game_id, name: g.game_name }))))
      .catch(setError);
  }, [playerId]);

  const sectionProps = { playerId, filters };

  return (
    <section className="stats-page">
      <PlayerStatsHeader player={player} />
      <ErrorMessage error={error} />
      <CohortFilters
        value={filters}
        games={games}
        onApply={(f) => setSearchParams(writeFilters(f))}
      />
      <CohortComparison {...sectionProps} />
      <ScoreDistribution {...sectionProps} />
      <DemographicBreakdown {...sectionProps} />
      <LearningCurve {...sectionProps} />
      <ConditionImpact {...sectionProps} />
      <LevelPerformance {...sectionProps} />
    </section>
  );
}
