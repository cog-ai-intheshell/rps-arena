import type { Player } from '../types';

export function Leaderboard({ players, selectedId, onSelect }: { players: Player[]; selectedId?: string; onSelect: (id: string) => void }) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  return (
    <section className="leaderboard-card">
      <header className="card-header">
        <h2>LEADERBOARD</h2>
        <span>{players.length} agents</span>
      </header>
      <div className="leaderboard-list">
        {sorted.map((player, index) => {
          const matches = player.matchWins + player.matchLosses + player.matchDraws;
          const winRate = matches ? (player.matchWins / matches) * 100 : 0;
          return (
            <button className={`player-row ${selectedId === player.id ? 'active' : ''}`} key={player.id} type="button" onClick={() => onSelect(player.id)}>
              <span className="rank">#{index + 1}</span>
              <span className="avatar" style={{ background: player.color }}>{player.avatar}</span>
              <span className="player-copy">
                <strong>{player.name}</strong>
                <small>{player.strategyType}</small>
              </span>
              <span className="elo-pill">{player.elo}</span>
              <span className="winrate">{winRate.toFixed(0)}%</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
