import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArenaConfig, Match, Player } from './types';
import { ControlPanel } from './components/ControlPanel';
import { EloChart, GenomeViewer, MatchupMatrix, MetricsGrid, MoveDistribution } from './components/Charts';
import { Inspector } from './components/Inspector';
import { Leaderboard } from './components/Leaderboard';
import { TournamentView } from './components/TournamentView';
import { breedHybrids, computeMetrics, createPopulation, defaultConfig, resetStats, simulateMatch } from './engine/arena';

type Selected = { type: 'player'; id: string } | { type: 'match'; id: string } | null;

type Snapshot = {
  version: string;
  exportedAt: string;
  config: ArenaConfig;
  players: Player[];
  matches: Match[];
  generation: number;
};

function download(filename: string, data: string) {
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [config, setConfig] = useState<ArenaConfig>(defaultConfig);
  const [players, setPlayers] = useState<Player[]>(() => createPopulation(defaultConfig));
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Selected>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('rps-arena-theme') ?? 'dark');

  const playersRef = useRef(players);
  const matchesRef = useRef(matches);
  const configRef = useRef(config);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { matchesRef.current = matches; }, [matches]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('rps-arena-theme', theme);
  }, [theme]);

  const metrics = useMemo(() => computeMetrics(players, matches), [matches, players]);
  const selectedPlayer = selected?.type === 'player' ? players.find((player) => player.id === selected.id) : undefined;
  const selectedMatch = selected?.type === 'match' ? matches.find((match) => match.id === selected.id) : undefined;

  const stepSimulation = useCallback((amount = 1) => {
    let nextPlayers = playersRef.current;
    const nextMatches = [...matchesRef.current];
    for (let i = 0; i < amount; i += 1) {
      const result = simulateMatch(nextPlayers, configRef.current, nextMatches.length);
      nextPlayers = result.players;
      nextMatches.push(result.match);
    }
    setPlayers(nextPlayers);
    setMatches(nextMatches.slice(-1000));
    setSelected({ type: 'match', id: nextMatches[nextMatches.length - 1].id });
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = window.setInterval(() => stepSimulation(configRef.current.simulationSpeed), 280);
    return () => window.clearInterval(interval);
  }, [isPlaying, stepSimulation]);

  const generatePopulation = useCallback(() => {
    const next = createPopulation(configRef.current);
    setIsPlaying(false);
    setPlayers(next);
    setMatches([]);
    setSelected({ type: 'player', id: next[0]?.id ?? '' });
    setGeneration(0);
  }, []);

  const resetArena = useCallback(() => {
    setIsPlaying(false);
    setPlayers((current) => resetStats(current));
    setMatches([]);
    setSelected(null);
  }, []);

  const breed = useCallback(() => {
    setIsPlaying(false);
    setPlayers((current) => resetStats(breedHybrids(current, configRef.current.crossoverPercent, configRef.current.mutationRate)));
    setMatches([]);
    setGeneration((value) => value + 1);
  }, []);

  const updatePlayer = useCallback((id: string, patch: Partial<Player>) => {
    setPlayers((current) => current.map((player) => (player.id === id ? { ...player, ...patch } : player)));
  }, []);

  const exportArena = useCallback(() => {
    const snapshot: Snapshot = {
      version: 'rps-ai-arena.v1',
      exportedAt: new Date().toISOString(),
      config,
      players,
      matches,
      generation,
    };
    download('rps-arena.json', JSON.stringify(snapshot, null, 2));
  }, [config, generation, matches, players]);

  const importArena = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<Snapshot>;
        if (!parsed.players || !parsed.config) throw new Error('Invalid RPS Arena file.');
        setIsPlaying(false);
        setConfig(parsed.config);
        setPlayers(parsed.players);
        setMatches(parsed.matches ?? []);
        setGeneration(parsed.generation ?? 0);
        setSelected(null);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to import file.');
      }
    };
    reader.readAsText(file);
  }, []);

  const metricCards = [
    { label: 'Matches', value: String(metrics.totalMatches), hint: `${metrics.totalRounds} rounds` },
    { label: 'Best Elo', value: metrics.bestElo.toFixed(0), hint: 'current leader' },
    { label: 'Average Elo', value: metrics.averageElo.toFixed(0), hint: 'population' },
    { label: 'Dummy Elo', value: metrics.dummyElo?.toFixed(0) ?? 'off', hint: 'model slot' },
    { label: 'Entropy', value: metrics.averageEntropy.toFixed(2), hint: 'avg bits' },
    { label: 'Top winrate', value: `${(metrics.highestWinRate * 100).toFixed(0)}%`, hint: 'match wins' },
  ];

  return (
    <div className="app-shell">
      <ControlPanel
        config={config}
        isPlaying={isPlaying}
        generation={generation}
        onConfig={(patch) => setConfig((current) => ({ ...current, ...patch }))}
        onGenerate={generatePopulation}
        onTogglePlay={() => setIsPlaying((value) => !value)}
        onStep={() => stepSimulation(1)}
        onRunBatch={() => stepSimulation(25)}
        onReset={resetArena}
        onBreed={breed}
        onExport={exportArena}
        onImport={importArena}
      />

      <main className="workspace">
        <section className="topbar">
          <div>
            <h2>Rock Paper Scissors Model Arena</h2>
            <p>Population tournament · Elo evolution · hybrid strategy genomes · dummy model adapter</p>
          </div>
          <div className="header-actions">
            <button className="header-button" type="button" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>{theme === 'dark' ? '☀' : '☾'}</button>
          </div>
        </section>

        <MetricsGrid metrics={metricCards} />

        <section className="main-grid">
          <TournamentView
            players={players}
            matches={matches}
            recentWindow={config.recentWindow}
            selectedMatchId={selected?.type === 'match' ? selected.id : undefined}
            onSelectMatch={(id) => setSelected({ type: 'match', id })}
            onSelectPlayer={(id) => setSelected({ type: 'player', id })}
          />
          <Leaderboard players={players} selectedId={selected?.type === 'player' ? selected.id : undefined} onSelect={(id) => setSelected({ type: 'player', id })} />
        </section>

        <section className="analytics-grid">
          <EloChart players={players} />
          <MoveDistribution player={selectedPlayer} />
          <GenomeViewer player={selectedPlayer} />
          <MatchupMatrix players={players} matches={matches} onSelectPlayer={(id) => setSelected({ type: 'player', id })} />
        </section>
      </main>

      <Inspector player={selectedPlayer} match={selectedMatch} onUpdatePlayer={updatePlayer} />
    </div>
  );
}

export default App;
