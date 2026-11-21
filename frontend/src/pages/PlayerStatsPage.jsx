import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getPlayer } from '../api/playersApi.js';
import { listGames } from '../api/catalogApi.js';
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

export default function PlayerStatsPage() {
  const { playerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayer(playerId).then(setPlayer).catch(setError);
    listGames().then(setGames).catch(setError);
  }, [playerId]);

  const sectionProps = { playerId, filters };

  return (
    <section className="stats-page">
      <PlayerStatsHeader player={player} playerId={playerId} />
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
