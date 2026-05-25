import type { Match, Move, Player } from '../types';
import { countPolicy, matchupMatrix } from '../engine/arena';

function polyline(points: { x: number; y: number }[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function MetricsGrid({ metrics }: { metrics: { label: string; value: string; hint?: string }[] }) {
  return (
    <section className="metrics-grid">
      {metrics.map((metric) => (
        <article className="metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.hint && <small>{metric.hint}</small>}
        </article>
      ))}
    </section>
  );
}

export function EloChart({ players }: { players: Player[] }) {
  const leaders = [...players].sort((a, b) => b.elo - a.elo).slice(0, 6);
  const width = 680;
  const height = 190;
  const all = leaders.flatMap((player) => player.eloHistory);
  const min = Math.min(1050, ...all) - 20;
  const max = Math.max(1350, ...all) + 20;
  const maxLen = Math.max(2, ...leaders.map((player) => player.eloHistory.length));

  return (
    <article className="chart-card elo-chart">
      <header className="card-header">
        <h2>ELO CURVE</h2>
        <span>top agents</span>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Elo history chart">
        {[0, 1, 2, 3].map((line) => <line key={line} x1="30" x2={width - 10} y1={20 + line * 42} y2={20 + line * 42} />)}
        {leaders.map((player) => {
          const points = player.eloHistory.map((elo, index) => ({
            x: 30 + (index / Math.max(1, maxLen - 1)) * (width - 48),
            y: height - 24 - ((elo - min) / Math.max(1, max - min)) * (height - 44),
          }));
          return <polyline key={player.id} points={polyline(points)} style={{ stroke: player.color }} />;
        })}
      </svg>
      <div className="chart-legend">
        {leaders.map((player) => <span key={player.id}><i style={{ background: player.color }} />{player.name}</span>)}
      </div>
    </article>
  );
}

export function MoveDistribution({ player }: { player?: Player }) {
  const policy = player ? countPolicy(player.history.map((round) => round.selfMove)) : { rock: 1 / 3, paper: 1 / 3, scissors: 1 / 3 };
  const entries: { move: Move; label: string; color: string }[] = [
    { move: 'rock', label: 'Rock', color: '#1677e8' },
    { move: 'paper', label: 'Paper', color: '#27AE60' },
    { move: 'scissors', label: 'Scissors', color: '#e87511' },
  ];
  return (
    <article className="chart-card distribution-card">
      <header className="card-header">
        <h2>MOVE DISTRIBUTION</h2>
        <span>{player?.name ?? 'global prior'}</span>
      </header>
      <div className="distribution-bars">
        {entries.map((entry) => (
          <div className="bar-row" key={entry.move}>
            <span>{entry.label}</span>
            <div><i style={{ width: `${policy[entry.move] * 100}%`, background: entry.color }} /></div>
            <strong>{(policy[entry.move] * 100).toFixed(0)}%</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

export function MatchupMatrix({ players, matches, onSelectPlayer }: { players: Player[]; matches: Match[]; onSelectPlayer: (id: string) => void }) {
  const top = [...players].sort((a, b) => b.elo - a.elo).slice(0, 8);
  const matrix = matchupMatrix(top, matches);
  const max = Math.max(1, ...matrix.flat());
  return (
    <article className="chart-card matchup-card">
      <header className="card-header">
        <h2>MATCHUP MATRIX</h2>
        <span>win pressure</span>
      </header>
      <div className="matrix-grid" style={{ gridTemplateColumns: `88px repeat(${top.length}, 1fr)` }}>
        <span />
        {top.map((player) => <button key={player.id} type="button" onClick={() => onSelectPlayer(player.id)}>{player.avatar}</button>)}
        {top.map((row, rowIndex) => (
          <div className="matrix-row" style={{ display: 'contents' }} key={row.id}>
            <button type="button" onClick={() => onSelectPlayer(row.id)}>{row.name.slice(0, 9)}</button>
            {top.map((col, colIndex) => {
              const value = matrix[rowIndex]?.[colIndex] ?? 0;
              return <span key={col.id} style={{ opacity: row.id === col.id ? 0.18 : 0.35 + (value / max) * 0.65 }}>{row.id === col.id ? '-' : value.toFixed(1)}</span>;
            })}
          </div>
        ))}
      </div>
    </article>
  );
}

export function GenomeViewer({ player }: { player?: Player }) {
  const weights = Object.entries(player?.genome?.weights ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 8);
  return (
    <article className="chart-card genome-card">
      <header className="card-header">
        <h2>STRATEGY DNA</h2>
        <span>{player?.strategyType ?? 'none'}</span>
      </header>
      {weights.length ? (
        <div className="genome-list">
          {weights.map(([id, weight]) => (
            <div className="gene" key={id}>
              <span>{id}</span>
              <div><i style={{ width: `${Math.min(100, Number(weight) * 60)}%` }} /></div>
              <strong>{Number(weight).toFixed(2)}</strong>
            </div>
          ))}
        </div>
      ) : <p className="muted-copy">This player uses a single explicit strategy.</p>}
    </article>
  );
}
