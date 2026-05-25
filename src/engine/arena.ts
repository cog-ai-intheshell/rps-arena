import type { ArenaConfig, ArenaMetrics, Match, Move, Player, Policy, Round, StrategyGenome, StrategyId } from '../types';
import { entropy, makeGenome, moves, payoff, resultFromPayoff, samplePolicy, selectableStrategyIds, strategyPolicy } from './strategies';

const colors = ['#1677e8', '#e87511', '#27AE60', '#EB5757', '#5D71FC', '#111827', '#0f5fbd', '#f89540'];
const avatars = ['R', 'P', 'S', 'AI', 'M', 'Q', 'Ω', 'π', 'β', 'μ'];

export const defaultConfig: ArenaConfig = {
  playerCount: 18,
  roundsPerMatch: 25,
  tournamentType: 'round_robin',
  crossoverPercent: 24,
  mutationRate: 0.08,
  includeDummyModel: true,
  simulationSpeed: 1,
  eloK: 28,
  recentWindow: 8,
};

export function strategyLabel(id: StrategyId): string {
  return id.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyPlayer(index: number, strategyType: StrategyId, genome?: StrategyGenome): Player {
  return {
    id: makeId('player', index),
    name: `${strategyLabel(strategyType)} ${index + 1}`,
    strategyType,
    elo: 1200,
    eloHistory: [1200],
    score: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    streak: 0,
    totalRounds: 0,
    history: [],
    genome,
    color: colors[index % colors.length],
    avatar: avatars[index % avatars.length],
    connectedModel: strategyType === 'dummy_model' || strategyType === 'external_model',
  };
}

export function createPopulation(config: ArenaConfig): Player[] {
  const baseIds = selectableStrategyIds.filter((id) => id !== 'dummy_model' && id !== 'external_model' && id !== 'hybrid_mix');
  const players: Player[] = [];
  const dummySlots = config.includeDummyModel ? 1 : 0;
  const count = Math.max(2, config.playerCount);

  for (let i = 0; i < count - dummySlots; i += 1) {
    const shouldHybrid = Math.random() * 100 < config.crossoverPercent;
    if (shouldHybrid) {
      const seeds = [baseIds[i % baseIds.length], baseIds[(i + 5) % baseIds.length], baseIds[(i + 11) % baseIds.length]];
      const genome = makeGenome(seeds);
      genome.mutationRate = config.mutationRate;
      players.push(emptyPlayer(i, 'hybrid_mix', genome));
    } else {
      players.push(emptyPlayer(i, baseIds[i % baseIds.length]));
    }
  }

  if (config.includeDummyModel) {
    players.push({ ...emptyPlayer(players.length, 'dummy_model'), name: 'Dummy model', color: '#111827', avatar: 'DM' });
  }

  return players;
}

export function resetStats(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    elo: 1200,
    eloHistory: [1200],
    score: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    streak: 0,
    totalRounds: 0,
    lastMove: undefined,
    history: [],
  }));
}

function clonePlayer(player: Player): Player {
  return {
    ...player,
    eloHistory: [...player.eloHistory],
    history: [...player.history],
    genome: player.genome ? { ...player.genome, weights: { ...player.genome.weights } } : undefined,
  };
}

export function scorePolicy(player: Player, opponent: Player, roundIndex: number): { policy: Policy; move: Move } {
  const policy = strategyPolicy(player.strategyType, player, opponent, roundIndex);
  return { policy, move: samplePolicy(policy) };
}

function updateRoundStats(player: Player, opponentId: string, matchId: string, round: number, selfMove: Move, opponentMove: Move, result: 'win' | 'loss' | 'draw'): Player {
  return {
    ...player,
    score: player.score + (result === 'win' ? 1 : result === 'loss' ? -1 : 0),
    wins: player.wins + (result === 'win' ? 1 : 0),
    losses: player.losses + (result === 'loss' ? 1 : 0),
    draws: player.draws + (result === 'draw' ? 1 : 0),
    totalRounds: player.totalRounds + 1,
    lastMove: selfMove,
    history: [
      ...player.history,
      { matchId, roundIndex: round, opponentId, selfMove, opponentMove, result },
    ],
  };
}

function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + 10 ** ((eloB - eloA) / 400));
}

function updateElo(playerA: Player, playerB: Player, matchScoreA: number, k: number): { a: Player; b: Player; deltaA: number; deltaB: number } {
  const expectedA = expectedScore(playerA.elo, playerB.elo);
  const expectedB = 1 - expectedA;
  const matchScoreB = 1 - matchScoreA;
  const deltaA = k * (matchScoreA - expectedA);
  const deltaB = k * (matchScoreB - expectedB);
  const nextA = Math.round(playerA.elo + deltaA);
  const nextB = Math.round(playerB.elo + deltaB);
  return {
    a: { ...playerA, elo: nextA, eloHistory: [...playerA.eloHistory, nextA] },
    b: { ...playerB, elo: nextB, eloHistory: [...playerB.eloHistory, nextB] },
    deltaA,
    deltaB,
  };
}

export function buildRoundRobinPairs(players: Player[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) pairs.push([players[i].id, players[j].id]);
  }
  return pairs;
}

export function pickPair(players: Player[], matchIndex: number, tournamentType: ArenaConfig['tournamentType']): [string, string] {
  if (players.length < 2) throw new Error('Need at least two players');
  if (tournamentType === 'round_robin') {
    const pairs = buildRoundRobinPairs(players);
    return pairs[matchIndex % pairs.length];
  }
  if (tournamentType === 'swiss') {
    const sorted = [...players].sort((a, b) => b.elo - a.elo);
    const offset = (matchIndex * 2) % Math.max(2, sorted.length - 1);
    const a = sorted[offset % sorted.length];
    const b = sorted[(offset + 1) % sorted.length];
    return [a.id, b.id];
  }
  if (tournamentType === 'knockout') {
    const sorted = [...players].sort((a, b) => b.elo - a.elo);
    const left = matchIndex % Math.ceil(sorted.length / 2);
    const right = sorted.length - 1 - left;
    return [sorted[left].id, sorted[right].id];
  }
  const first = players[Math.floor(Math.random() * players.length)];
  let second = players[Math.floor(Math.random() * players.length)];
  while (second.id === first.id) second = players[Math.floor(Math.random() * players.length)];
  return [first.id, second.id];
}

export function simulateMatch(players: Player[], config: ArenaConfig, matchIndex: number): { players: Player[]; match: Match } {
  const [playerAId, playerBId] = pickPair(players, matchIndex, config.tournamentType);
  const playerMap = new Map(players.map((player) => [player.id, clonePlayer(player)]));
  let playerA = playerMap.get(playerAId);
  let playerB = playerMap.get(playerBId);
  if (!playerA || !playerB) throw new Error('Invalid match pair');

  const matchId = `match-${matchIndex + 1}`;
  const rounds: Round[] = [];
  let scoreA = 0;
  let scoreB = 0;

  for (let roundIndex = 0; roundIndex < config.roundsPerMatch; roundIndex += 1) {
    const moveA = scorePolicy(playerA, playerB, roundIndex).move;
    const moveB = scorePolicy(playerB, playerA, roundIndex).move;
    const payoffA = payoff(moveA, moveB);
    const resultA = resultFromPayoff(payoffA);
    const resultB = resultFromPayoff(-payoffA);

    scoreA += payoffA > 0 ? 1 : payoffA === 0 ? 0 : -1;
    scoreB += payoffA < 0 ? 1 : payoffA === 0 ? 0 : -1;

    rounds.push({ index: roundIndex + 1, moveA, moveB, resultA, resultB });
    playerA = updateRoundStats(playerA, playerB.id, matchId, roundIndex + 1, moveA, moveB, resultA);
    playerB = updateRoundStats(playerB, playerA.id, matchId, roundIndex + 1, moveB, moveA, resultB);
  }

  const outcomeA = scoreA > scoreB ? 1 : scoreA < scoreB ? 0 : 0.5;
  const winnerId = scoreA > scoreB ? playerA.id : scoreB > scoreA ? playerB.id : undefined;
  playerA = {
    ...playerA,
    matchWins: playerA.matchWins + (outcomeA === 1 ? 1 : 0),
    matchLosses: playerA.matchLosses + (outcomeA === 0 ? 1 : 0),
    matchDraws: playerA.matchDraws + (outcomeA === 0.5 ? 1 : 0),
    streak: outcomeA === 1 ? Math.max(1, playerA.streak + 1) : outcomeA === 0 ? Math.min(-1, playerA.streak - 1) : 0,
  };
  playerB = {
    ...playerB,
    matchWins: playerB.matchWins + (outcomeA === 0 ? 1 : 0),
    matchLosses: playerB.matchLosses + (outcomeA === 1 ? 1 : 0),
    matchDraws: playerB.matchDraws + (outcomeA === 0.5 ? 1 : 0),
    streak: outcomeA === 0 ? Math.max(1, playerB.streak + 1) : outcomeA === 1 ? Math.min(-1, playerB.streak - 1) : 0,
  };

  const elo = updateElo(playerA, playerB, outcomeA, config.eloK);
  playerMap.set(playerA.id, elo.a);
  playerMap.set(playerB.id, elo.b);

  const nextPlayers = players.map((player) => playerMap.get(player.id) ?? player);
  return {
    players: nextPlayers,
    match: {
      id: matchId,
      index: matchIndex + 1,
      playerAId: playerA.id,
      playerBId: playerB.id,
      playerAName: playerA.name,
      playerBName: playerB.name,
      strategyA: playerA.strategyType,
      strategyB: playerB.strategyType,
      rounds,
      winnerId,
      scoreA,
      scoreB,
      eloDeltaA: elo.deltaA,
      eloDeltaB: elo.deltaB,
    },
  };
}

export function breedHybrids(players: Player[], crossoverPercent: number, mutationRate: number): Player[] {
  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  const count = Math.max(1, Math.floor(players.length * crossoverPercent / 100));
  const selectedIds = new Set(sorted.slice(-count).map((player) => player.id));
  const elites = sorted.slice(0, Math.max(2, Math.ceil(players.length * 0.35)));

  return players.map((player, index) => {
    if (!selectedIds.has(player.id) || player.strategyType === 'dummy_model') return player;
    const parentA = elites[index % elites.length];
    const parentB = elites[(index + 1) % elites.length];
    const weights: Partial<Record<StrategyId, number>> = {};
    const allKeys = new Set<StrategyId>([
      ...Object.keys(parentA.genome?.weights ?? { [parentA.strategyType]: 1 }) as StrategyId[],
      ...Object.keys(parentB.genome?.weights ?? { [parentB.strategyType]: 1 }) as StrategyId[],
      parentA.strategyType,
      parentB.strategyType,
    ]);
    for (const key of allKeys) {
      if (key === 'hybrid_mix' || key === 'dummy_model' || key === 'external_model') continue;
      const a = parentA.genome?.weights[key] ?? (parentA.strategyType === key ? 1 : 0);
      const b = parentB.genome?.weights[key] ?? (parentB.strategyType === key ? 1 : 0);
      const mixed = Math.random() < 0.5 ? a : b;
      weights[key] = Math.max(0, mixed + (Math.random() - 0.5) * mutationRate * 2);
    }
    return {
      ...player,
      strategyType: 'hybrid_mix',
      name: `Hybrid ${index + 1}`,
      genome: {
        weights,
        mutationRate,
        noise: 0.02 + Math.random() * 0.08,
        memoryWindow: 4 + Math.floor(Math.random() * 12),
        temperature: 0.75 + Math.random() * 0.65,
      },
    };
  });
}

export function computeMetrics(players: Player[], matches: Match[]): ArenaMetrics {
  const totalRounds = players.reduce((sum, player) => sum + player.totalRounds, 0);
  const bestElo = Math.max(...players.map((player) => player.elo));
  const averageElo = players.reduce((sum, player) => sum + player.elo, 0) / Math.max(1, players.length);
  const dummy = players.find((player) => player.strategyType === 'dummy_model');
  const highestWinRate = Math.max(...players.map((player) => player.matchWins / Math.max(1, player.matchWins + player.matchLosses + player.matchDraws)));
  const averageEntropy = players.reduce((sum, player) => {
    const policy = player.history.length ? countPolicy(player.history.map((round) => round.selfMove)) : { rock: 1 / 3, paper: 1 / 3, scissors: 1 / 3 };
    return sum + entropy(policy);
  }, 0) / Math.max(1, players.length);
  return { totalMatches: matches.length, totalRounds, bestElo, averageElo, dummyElo: dummy?.elo, averageEntropy, highestWinRate };
}

export function countPolicy(history: Move[]): Policy {
  const counts = { rock: 0.0001, paper: 0.0001, scissors: 0.0001 };
  for (const move of history) counts[move] += 1;
  const total = counts.rock + counts.paper + counts.scissors;
  return { rock: counts.rock / total, paper: counts.paper / total, scissors: counts.scissors / total };
}

export function matchupMatrix(players: Player[], matches: Match[]): number[][] {
  const index = new Map(players.map((player, i) => [player.id, i]));
  const matrix = Array.from({ length: players.length }, () => Array(players.length).fill(0));
  for (const match of matches) {
    const a = index.get(match.playerAId);
    const b = index.get(match.playerBId);
    if (a == null || b == null) continue;
    matrix[a][b] += match.scoreA > match.scoreB ? 1 : match.scoreA === match.scoreB ? 0.5 : 0;
    matrix[b][a] += match.scoreB > match.scoreA ? 1 : match.scoreA === match.scoreB ? 0.5 : 0;
  }
  return matrix;
}

export function moveIcon(move: Move): string {
  if (move === 'rock') return 'R';
  if (move === 'paper') return 'P';
  return 'S';
}
