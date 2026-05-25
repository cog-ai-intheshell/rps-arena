import type { Match, Player, StrategyId } from '../types';
import { moveIcon, strategyLabel } from '../engine/arena';
import { entropy, strategyCatalog } from '../engine/strategies';
import { countPolicy } from '../engine/arena';

type InspectorProps = {
  player?: Player;
  match?: Match;
  onUpdatePlayer: (id: string, patch: Partial<Player>) => void;
};

export function Inspector({ player, match, onUpdatePlayer }: InspectorProps) {
  if (!player && !match) {
    return (
      <aside className="inspector empty-state">
        <h2>INSPECTOR</h2>
        <p>Select an agent or a match to inspect its behavior, Elo, policy entropy and local history.</p>
        <section className="paper-note">
          <strong>Model contract</strong>
          <code>{'{ history, opponent, score } -> { move, confidence, logits }'}</code>
        </section>
      </aside>
    );
  }

  if (match) {
    return (
      <aside className="inspector">
        <h2>MATCH INSPECTOR</h2>
        <div className="match-summary-card">
          <span>#{match.index}</span>
          <strong>{match.playerAName}</strong>
          <b>{match.scoreA} / {match.scoreB}</b>
          <strong>{match.playerBName}</strong>
        </div>
        <div className="round-table">
          <header><span>Round</span><span>A</span><span>B</span><span>Result</span></header>
          {match.rounds.slice(-24).map((round) => (
            <div key={round.index}>
              <span>{round.index}</span>
              <strong>{moveIcon(round.moveA)}</strong>
              <strong>{moveIcon(round.moveB)}</strong>
              <span>{round.resultA}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (!player) return null;
  const policy = countPolicy(player.history.map((round) => round.selfMove));
  const matches = player.matchWins + player.matchLosses + player.matchDraws;
  const winRate = matches ? (player.matchWins / matches) * 100 : 0;
  const strategyInfo = strategyCatalog.find((item) => item.id === player.strategyType);

  return (
    <aside className="inspector">
      <h2>PLAYER INSPECTOR</h2>
      <div className="player-hero">
        <span className="hero-avatar" style={{ background: player.color }}>{player.avatar}</span>
        <div>
          <input value={player.name} onChange={(event) => onUpdatePlayer(player.id, { name: event.target.value })} />
          <small>{strategyInfo?.description ?? 'Custom strategy.'}</small>
        </div>
      </div>
      <label className="field-label select-field">
        <span>Strategy</span>
        <select value={player.strategyType} onChange={(event) => onUpdatePlayer(player.id, { strategyType: event.target.value as StrategyId })}>
          {strategyCatalog.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.label}</option>)}
        </select>
      </label>
      <label className="field-label color-field">
        <span>Color</span>
        <input type="color" value={player.color} onChange={(event) => onUpdatePlayer(player.id, { color: event.target.value })} />
      </label>
      <div className="dynamic-readout">
        <span>Elo</span><strong>{player.elo}</strong>
        <span>Win rate</span><strong>{winRate.toFixed(1)}%</strong>
        <span>Rounds</span><strong>{player.totalRounds}</strong>
        <span>Entropy</span><strong>{entropy(policy).toFixed(2)} bits</strong>
        <span>Streak</span><strong>{player.streak}</strong>
        <span>Model</span><strong>{player.connectedModel ? 'connected' : 'local strategy'}</strong>
      </div>
      <section className="paper-note">
        <h3>Policy distribution</h3>
        <div className="policy-triplet">
          <span>Rock <b>{(policy.rock * 100).toFixed(0)}%</b></span>
          <span>Paper <b>{(policy.paper * 100).toFixed(0)}%</b></span>
          <span>Scissors <b>{(policy.scissors * 100).toFixed(0)}%</b></span>
        </div>
      </section>
      <section className="paper-note">
        <h3>Recent local memory</h3>
        <div className="memory-strip">
          {player.history.slice(-30).map((round, index) => <span key={`${round.matchId}-${round.roundIndex}-${index}`} className={round.result}>{moveIcon(round.selfMove)}</span>)}
        </div>
      </section>
    </aside>
  );
}
