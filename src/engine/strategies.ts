import type { Move, Player, Policy, RoundRecord, StrategyDescriptor, StrategyGenome, StrategyId } from '../types';

export const moves: Move[] = ['rock', 'paper', 'scissors'];
export const basePolicy: Policy = { rock: 1 / 3, paper: 1 / 3, scissors: 1 / 3 };

export const strategyCatalog: StrategyDescriptor[] = [
  { id: 'random', label: 'Random', family: 'baseline', description: 'Uniformly samples rock, paper or scissors.' },
  { id: 'biased_rock', label: 'Biased rock', family: 'baseline', description: 'Random but with a strong rock prior.' },
  { id: 'biased_paper', label: 'Biased paper', family: 'baseline', description: 'Random but with a strong paper prior.' },
  { id: 'biased_scissors', label: 'Biased scissors', family: 'baseline', description: 'Random but with a strong scissors prior.' },
  { id: 'cycle', label: 'Cycle', family: 'memory', description: 'Loops rock, paper, scissors.' },
  { id: 'cycle_reverse', label: 'Reverse cycle', family: 'memory', description: 'Loops scissors, paper, rock.' },
  { id: 'copy_last', label: 'Copy last', family: 'memory', description: 'Copies the opponent previous move.' },
  { id: 'counter_last', label: 'Counter last', family: 'memory', description: 'Counters the opponent previous move.' },
  { id: 'always_rock', label: 'Always rock', family: 'baseline', description: 'A simple fixed rock bot.' },
  { id: 'always_paper', label: 'Always paper', family: 'baseline', description: 'A simple fixed paper bot.' },
  { id: 'always_scissors', label: 'Always scissors', family: 'baseline', description: 'A simple fixed scissors bot.' },
  { id: 'win_stay_lose_shift', label: 'Win stay lose shift', family: 'adaptive', description: 'Repeats after wins, shifts after losses.' },
  { id: 'counter_most_frequent', label: 'Counter most frequent', family: 'predictive', description: 'Counters the opponent most used move.' },
  { id: 'counter_recent_window', label: 'Counter recent window', family: 'predictive', description: 'Counters the most frequent move in a recent window.' },
  { id: 'anti_copy_last', label: 'Anti copy last', family: 'predictive', description: 'Assumes opponent copies us and counters our previous move.' },
  { id: 'markov_predictor', label: 'Markov predictor', family: 'predictive', description: 'Predicts next opponent move from first-order transitions.' },
  { id: 'noisy_counter_last', label: 'Noisy counter last', family: 'adaptive', description: 'Mostly counters last move with a random fallback.' },
  { id: 'adaptive_random_bias', label: 'Adaptive random bias', family: 'adaptive', description: 'Adjusts random bias toward counters of opponent tendencies.' },
  { id: 'bayesian_markov', label: 'Bayesian Markov', family: 'predictive', description: 'Markov predictor with Bayesian smoothing.' },
  { id: 'frequency_matcher', label: 'Frequency matcher', family: 'adaptive', description: 'Mirrors the opponent empirical distribution.' },
  { id: 'counter_least_frequent', label: 'Counter least frequent', family: 'predictive', description: 'Exploits underused moves by baiting simple counters.' },
  { id: 'pattern_matcher_ngram', label: 'Pattern n-gram', family: 'predictive', description: 'Looks for repeated two-move contexts.' },
  { id: 'markov_order_2', label: 'Markov order 2', family: 'predictive', description: 'Predicts from the two most recent opponent moves.' },
  { id: 'epsilon_greedy_counter', label: 'Epsilon greedy', family: 'learning', description: 'Counters frequency with exploration.' },
  { id: 'thompson_sampling', label: 'Thompson sampling', family: 'learning', description: 'Samples a likely opponent bias and counters it.' },
  { id: 'ucb_bandit', label: 'UCB bandit', family: 'learning', description: 'Chooses moves with upper-confidence exploration.' },
  { id: 'fictitious_play', label: 'Fictitious play', family: 'learning', description: 'Best-responds to the opponent historical distribution.' },
  { id: 'regret_matching', label: 'Regret matching', family: 'learning', description: 'Weights moves by accumulated counterfactual regret.' },
  { id: 'meta_strategy_selector', label: 'Meta selector', family: 'adaptive', description: 'Blends several predictors and chooses the most confident one.' },
  { id: 'entropy_maximizer', label: 'Entropy maximizer', family: 'adaptive', description: 'Stays deliberately hard to predict.' },
  { id: 'exploit_then_randomize', label: 'Exploit then randomize', family: 'adaptive', description: 'Exploits early patterns, then hides behind random play.' },
  { id: 'counter_cycle_detector', label: 'Cycle detector', family: 'predictive', description: 'Detects cycles and counters the next expected move.' },
  { id: 'q_learning_tabular', label: 'Q-learning tabular', family: 'learning', description: 'A lightweight table policy over recent contexts.' },
  { id: 'dummy_model', label: 'Dummy model', family: 'model', description: 'Mock model endpoint that returns random logits.' },
  { id: 'external_model', label: 'External model', family: 'model', description: 'Placeholder for a future connected AI endpoint.' },
  { id: 'hybrid_mix', label: 'Hybrid mix', family: 'hybrid', description: 'Weighted genome combining multiple strategies.' },
];

export const selectableStrategyIds = strategyCatalog.filter((strategy) => strategy.id !== 'external_model').map((strategy) => strategy.id);

export function counterMove(move: Move): Move {
  if (move === 'rock') return 'paper';
  if (move === 'paper') return 'scissors';
  return 'rock';
}

export function losingMove(move: Move): Move {
  if (move === 'rock') return 'scissors';
  if (move === 'paper') return 'rock';
  return 'paper';
}

export function normalize(policy: Partial<Policy>): Policy {
  const cleaned: Policy = {
    rock: Math.max(0, policy.rock ?? 0),
    paper: Math.max(0, policy.paper ?? 0),
    scissors: Math.max(0, policy.scissors ?? 0),
  };
  const sum = cleaned.rock + cleaned.paper + cleaned.scissors;
  if (sum <= 0) return { ...basePolicy };
  return { rock: cleaned.rock / sum, paper: cleaned.paper / sum, scissors: cleaned.scissors / sum };
}

export function oneHot(move: Move, confidence = 0.9): Policy {
  const side = (1 - confidence) / 2;
  return normalize({ rock: side, paper: side, scissors: side, [move]: confidence });
}

export function samplePolicy(policy: Policy): Move {
  const r = Math.random();
  if (r < policy.rock) return 'rock';
  if (r < policy.rock + policy.paper) return 'paper';
  return 'scissors';
}

export function entropy(policy: Policy): number {
  return moves.reduce((total, move) => {
    const p = Math.max(policy[move], 1e-9);
    return total - p * Math.log2(p);
  }, 0);
}

export function opponentMoves(player: Player, opponentId?: string): Move[] {
  return player.history.filter((round) => !opponentId || round.opponentId === opponentId).map((round) => round.opponentMove);
}

export function selfMoves(player: Player, opponentId?: string): Move[] {
  return player.history.filter((round) => !opponentId || round.opponentId === opponentId).map((round) => round.selfMove);
}

function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

function countMoves(history: Move[]): Policy {
  return normalize({
    rock: history.filter((move) => move === 'rock').length + 0.0001,
    paper: history.filter((move) => move === 'paper').length + 0.0001,
    scissors: history.filter((move) => move === 'scissors').length + 0.0001,
  });
}

function mostFrequent(history: Move[], fallback: Move = 'rock'): Move {
  if (history.length === 0) return fallback;
  const counts = countMoves(history);
  return moves.reduce((best, move) => (counts[move] > counts[best] ? move : best), 'rock' as Move);
}

function leastFrequent(history: Move[], fallback: Move = 'scissors'): Move {
  if (history.length === 0) return fallback;
  const counts = countMoves(history);
  return moves.reduce((best, move) => (counts[move] < counts[best] ? move : best), 'rock' as Move);
}

function predictMarkov(history: Move[], order = 1, smoothing = 0): Policy {
  if (history.length <= order) return { ...basePolicy };
  const context = history.slice(-order).join('-');
  const counts: Partial<Policy> = { rock: smoothing, paper: smoothing, scissors: smoothing };
  for (let i = 0; i < history.length - order; i += 1) {
    if (history.slice(i, i + order).join('-') === context) {
      const next = history[i + order];
      counts[next] = (counts[next] ?? 0) + 1;
    }
  }
  return normalize(counts);
}

function counterPredicted(policy: Policy, confidence = 0.92): Policy {
  const predicted = moves.reduce((best, move) => (policy[move] > policy[best] ? move : best), 'rock' as Move);
  return oneHot(counterMove(predicted), confidence);
}

function recent(player: Player, opponent: Player, window: number): Move[] {
  return opponentMoves(player, opponent.id).slice(-window);
}

function resultScore(result: RoundRecord['result']): number {
  if (result === 'win') return 1;
  if (result === 'draw') return 0.2;
  return -1;
}

export function strategyPolicy(strategyId: StrategyId, self: Player, opponent: Player, roundIndex: number): Policy {
  const oppHistory = opponentMoves(self, opponent.id);
  const ownHistory = selfMoves(self, opponent.id);
  const globalOppHistory = opponentMoves(self);
  const lastOpponent = last(oppHistory);
  const lastOwn = last(ownHistory);
  const lastRound = last(self.history.filter((round) => round.opponentId === opponent.id));
  const window = self.genome?.memoryWindow ?? 8;

  switch (strategyId) {
    case 'biased_rock': return normalize({ rock: 0.7, paper: 0.18, scissors: 0.12 });
    case 'biased_paper': return normalize({ rock: 0.12, paper: 0.7, scissors: 0.18 });
    case 'biased_scissors': return normalize({ rock: 0.18, paper: 0.12, scissors: 0.7 });
    case 'always_rock': return oneHot('rock', 1);
    case 'always_paper': return oneHot('paper', 1);
    case 'always_scissors': return oneHot('scissors', 1);
    case 'cycle': return oneHot(moves[roundIndex % 3], 0.95);
    case 'cycle_reverse': return oneHot((['scissors', 'paper', 'rock'] as Move[])[roundIndex % 3], 0.95);
    case 'copy_last': return lastOpponent ? oneHot(lastOpponent, 0.88) : { ...basePolicy };
    case 'counter_last': return lastOpponent ? oneHot(counterMove(lastOpponent), 0.9) : { ...basePolicy };
    case 'anti_copy_last': return lastOwn ? oneHot(counterMove(lastOwn), 0.88) : { ...basePolicy };
    case 'win_stay_lose_shift': {
      if (!lastOwn || !lastRound) return { ...basePolicy };
      if (lastRound.result === 'win') return oneHot(lastOwn, 0.88);
      if (lastRound.result === 'loss') return oneHot(counterMove(lastOwn), 0.78);
      return oneHot(moves[(moves.indexOf(lastOwn) + 1) % 3], 0.68);
    }
    case 'counter_most_frequent': return oneHot(counterMove(mostFrequent(globalOppHistory)), 0.9);
    case 'counter_recent_window': return oneHot(counterMove(mostFrequent(recent(self, opponent, window))), 0.9);
    case 'noisy_counter_last': return lastOpponent ? normalize({ ...basePolicy, [counterMove(lastOpponent)]: 2.2 }) : { ...basePolicy };
    case 'adaptive_random_bias': return counterPredicted(countMoves(globalOppHistory), 0.72);
    case 'frequency_matcher': return countMoves(globalOppHistory);
    case 'counter_least_frequent': return oneHot(counterMove(leastFrequent(globalOppHistory)), 0.78);
    case 'markov_predictor': return counterPredicted(predictMarkov(oppHistory, 1, 0.1), 0.88);
    case 'bayesian_markov': return counterPredicted(predictMarkov(oppHistory, 1, 1.2), 0.82);
    case 'pattern_matcher_ngram': return counterPredicted(predictMarkov(oppHistory, 2, 0.3), 0.86);
    case 'markov_order_2': return counterPredicted(predictMarkov(oppHistory, 2, 0.8), 0.82);
    case 'epsilon_greedy_counter': return Math.random() < 0.16 ? { ...basePolicy } : oneHot(counterMove(mostFrequent(globalOppHistory)), 0.86);
    case 'thompson_sampling': {
      const counts = countMoves(globalOppHistory);
      const noisy = normalize({ rock: counts.rock + Math.random() * 0.35, paper: counts.paper + Math.random() * 0.35, scissors: counts.scissors + Math.random() * 0.35 });
      return counterPredicted(noisy, 0.84);
    }
    case 'ucb_bandit': {
      const scores = moves.map((move) => {
        const trials = Math.max(1, ownHistory.filter((item) => item === move).length);
        const reward = self.history.filter((round) => round.selfMove === move).reduce((sum, round) => sum + resultScore(round.result), 0);
        return { move, value: reward / trials + Math.sqrt(Math.log(Math.max(2, self.history.length + 1)) / trials) };
      });
      return oneHot(scores.sort((a, b) => b.value - a.value)[0].move, 0.82);
    }
    case 'fictitious_play': return oneHot(counterMove(mostFrequent(globalOppHistory)), 0.92);
    case 'regret_matching': {
      const regret: Partial<Policy> = { rock: 0.1, paper: 0.1, scissors: 0.1 };
      for (const round of self.history.slice(-30)) {
        for (const move of moves) {
          const alternative = payoff(move, round.opponentMove);
          const actual = payoff(round.selfMove, round.opponentMove);
          regret[move] = Math.max(0, (regret[move] ?? 0) + alternative - actual);
        }
      }
      return normalize(regret);
    }
    case 'meta_strategy_selector': {
      const candidates = ['counter_last', 'markov_predictor', 'counter_recent_window', 'epsilon_greedy_counter'] as StrategyId[];
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      return strategyPolicy(chosen, self, opponent, roundIndex);
    }
    case 'entropy_maximizer': return normalize({ rock: 1 + Math.random() * 0.1, paper: 1 + Math.random() * 0.1, scissors: 1 + Math.random() * 0.1 });
    case 'exploit_then_randomize': return self.totalRounds < 80 ? oneHot(counterMove(mostFrequent(globalOppHistory)), 0.88) : { ...basePolicy };
    case 'counter_cycle_detector': {
      if (oppHistory.length < 3) return { ...basePolicy };
      const lastThree = oppHistory.slice(-3).join('-');
      if (lastThree === 'rock-paper-scissors') return oneHot('rock', 0.92);
      if (lastThree === 'paper-scissors-rock') return oneHot('paper', 0.92);
      if (lastThree === 'scissors-rock-paper') return oneHot('scissors', 0.92);
      return strategyPolicy('counter_last', self, opponent, roundIndex);
    }
    case 'q_learning_tabular': {
      const context = lastOpponent ?? 'rock';
      const contextRounds = self.history.filter((round) => round.opponentMove === context).slice(-25);
      const values = moves.map((move) => ({
        move,
        value: contextRounds.filter((round) => round.selfMove === move).reduce((sum, round) => sum + resultScore(round.result), 0),
      }));
      return oneHot(values.sort((a, b) => b.value - a.value)[0].move, 0.82);
    }
    case 'dummy_model': return normalize({ rock: Math.random(), paper: Math.random(), scissors: Math.random() });
    case 'external_model': return normalize({ rock: 0.34, paper: 0.33, scissors: 0.33 });
    case 'hybrid_mix': return hybridPolicy(self.genome ?? makeGenome(['random', 'counter_last', 'markov_predictor']), self, opponent, roundIndex);
    default: return { ...basePolicy };
  }
}

export function payoff(a: Move, b: Move): number {
  if (a === b) return 0;
  return counterMove(b) === a ? 1 : -1;
}

export function resultFromPayoff(value: number): 'win' | 'loss' | 'draw' {
  if (value > 0) return 'win';
  if (value < 0) return 'loss';
  return 'draw';
}

export function hybridPolicy(genome: StrategyGenome, self: Player, opponent: Player, roundIndex: number): Policy {
  const combined: Partial<Policy> = { rock: 0, paper: 0, scissors: 0 };
  let totalWeight = 0;
  for (const [strategyId, weight] of Object.entries(genome.weights) as [StrategyId, number][]) {
    if (weight <= 0 || strategyId === 'hybrid_mix') continue;
    const policy = strategyPolicy(strategyId, self, opponent, roundIndex);
    for (const move of moves) combined[move] = (combined[move] ?? 0) + policy[move] * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return { ...basePolicy };
  const noise = genome.noise;
  for (const move of moves) combined[move] = (combined[move] ?? 0) / totalWeight + Math.random() * noise;
  const temperature = Math.max(0.2, genome.temperature);
  return normalize({ rock: Math.pow(combined.rock ?? 0, 1 / temperature), paper: Math.pow(combined.paper ?? 0, 1 / temperature), scissors: Math.pow(combined.scissors ?? 0, 1 / temperature) });
}

export function makeGenome(seedStrategies: StrategyId[]): StrategyGenome {
  const weights: Partial<Record<StrategyId, number>> = {};
  for (const id of seedStrategies) weights[id] = 0.4 + Math.random();
  return {
    weights,
    mutationRate: 0.08,
    noise: 0.04,
    memoryWindow: 8,
    temperature: 1,
  };
}
