import type { Match, Player } from '../types';
import { moveIcon, strategyLabel } from '../engine/arena';

function playerById(players: Player[], id: string): Player | undefined {
  return players.find((player) => player.id === id);
}

function winnerLabel(match: Match): string {
  if (!match.winnerId) return 'Draw';
  return match.winnerId === match.playerAId ? match.playerAName : match.playerBName;
}

function buildBracketColumns(matches: Match[]): Match[][] {
  const columns: Match[][] = [];
  let offset = 0;
  let size = Math.ceil(matches.length / 2);

  while (offset < matches.length) {
    const nextOffset = Math.min(matches.length, offset + Math.max(1, size));
    columns.push(matches.slice(offset, nextOffset));
    offset = nextOffset;
    size = Math.ceil((matches.length - offset) / 2);
  }

  return columns;
}

function roundLabel(index: number, total: number): string {
  if (index === 0) return 'Recent duels';
  if (index === total - 1) return 'Latest winner';
  return 'Winner path';
}

export function TournamentView({ players, matches, selectedMatchId, recentWindow, onSelectMatch, onSelectPlayer }: {
  players: Player[];
  matches: Match[];
  selectedMatchId?: string;
  recentWindow: number;
  onSelectMatch: (id: string) => void;
  onSelectPlayer: (id: string) => void;
}) {
  const latest = matches[matches.length - 1];
  const bracketWindow = matches.slice(-Math.max(3, recentWindow));
  const bracketColumns = buildBracketColumns(bracketWindow);
  const pA = latest ? playerById(players, latest.playerAId) : undefined;
  const pB = latest ? playerById(players, latest.playerBId) : undefined;

  return (
    <section className="arena-card">
      <header className="sim-header">
        <h2>Tournament Arena</h2>
        <p>{matches.length ? `Match ${matches.length} · ${latest?.playerAName} vs ${latest?.playerBName}` : 'Generate a population and step the simulation.'}</p>
      </header>
      <div className="arena-body">
        <div className="versus-stage">
          {latest && pA && pB ? (
            <>
              <button className="fighter-card" type="button" onClick={() => onSelectPlayer(pA.id)}>
                <span className="fighter-avatar" style={{ background: pA.color }}>{pA.avatar}</span>
                <strong>{pA.name}</strong>
                <small>{strategyLabel(pA.strategyType)}</small>
                <b>{latest.scoreA}</b>
                <em>{latest.eloDeltaA >= 0 ? '+' : ''}{latest.eloDeltaA.toFixed(1)} Elo</em>
              </button>
              <div className="round-orbit">
                <span>VS</span>
                <strong>{latest.winnerId ? 'winner locked' : 'draw'}</strong>
              </div>
              <button className="fighter-card" type="button" onClick={() => onSelectPlayer(pB.id)}>
                <span className="fighter-avatar" style={{ background: pB.color }}>{pB.avatar}</span>
                <strong>{pB.name}</strong>
                <small>{strategyLabel(pB.strategyType)}</small>
                <b>{latest.scoreB}</b>
                <em>{latest.eloDeltaB >= 0 ? '+' : ''}{latest.eloDeltaB.toFixed(1)} Elo</em>
              </button>
            </>
          ) : (
            <div className="empty-stage">
              <h3>No match yet</h3>
              <p>Press Step, Batch, or Play to start the arena.</p>
            </div>
          )}
        </div>

        <div className="bracket-panel">
          <div className="bracket-heading">
            <h3>Fight Tree</h3>
            <span>{bracketWindow.length ? `${bracketWindow.length} recent matches · winners highlighted` : 'winner path appears after the first match'}</span>
          </div>
          <div className="bracket-tree" style={{ gridTemplateColumns: `repeat(${Math.max(1, bracketColumns.length)}, minmax(190px, 1fr))` }}>
            {bracketColumns.length ? bracketColumns.map((column, columnIndex) => (
              <div className="bracket-column" key={columnIndex}>
                <span className="bracket-round">{roundLabel(columnIndex, bracketColumns.length)}</span>
                {column.map((match) => {
                  const playerA = playerById(players, match.playerAId);
                  const playerB = playerById(players, match.playerBId);
                  return (
                    <article className={`bracket-node ${selectedMatchId === match.id ? 'active' : ''}`} key={match.id}>
                      <button className="bracket-match-button" type="button" onClick={() => onSelectMatch(match.id)}>
                        <span>Match #{match.index}</span>
                        <strong>{winnerLabel(match)}</strong>
                        <small>{match.scoreA} / {match.scoreB}</small>
                      </button>
                      <button className={`bracket-player ${match.winnerId === match.playerAId ? 'winner' : ''}`} type="button" onClick={() => onSelectPlayer(match.playerAId)}>
                        <i style={{ background: playerA?.color ?? '#1677e8' }}>{playerA?.avatar ?? 'A'}</i>
                        <span>{match.playerAName}</span>
                        <b>{match.scoreA}</b>
                      </button>
                      <button className={`bracket-player ${match.winnerId === match.playerBId ? 'winner' : ''}`} type="button" onClick={() => onSelectPlayer(match.playerBId)}>
                        <i style={{ background: playerB?.color ?? '#e87511' }}>{playerB?.avatar ?? 'B'}</i>
                        <span>{match.playerBName}</span>
                        <b>{match.scoreB}</b>
                      </button>
                      <small className="bracket-rounds">{match.rounds.slice(-4).map((round) => `${moveIcon(round.moveA)}${moveIcon(round.moveB)}`).join(' · ')}</small>
                    </article>
                  );
                })}
              </div>
            )) : (
              <div className="bracket-empty">
                <strong>No bracket yet</strong>
                <span>Run a few matches to grow the tree.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
