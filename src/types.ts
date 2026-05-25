export type Move = 'rock' | 'paper' | 'scissors';
export type RoundResult = 'win' | 'loss' | 'draw';
export type TournamentType = 'round_robin' | 'swiss' | 'knockout' | 'league_continuous';

export type StrategyId =
  | 'random'
  | 'biased_rock'
  | 'biased_paper'
  | 'biased_scissors'
  | 'cycle'
  | 'cycle_reverse'
  | 'copy_last'
  | 'counter_last'
  | 'always_rock'
  | 'always_paper'
  | 'always_scissors'
  | 'win_stay_lose_shift'
  | 'counter_most_frequent'
  | 'counter_recent_window'
  | 'anti_copy_last'
  | 'markov_predictor'
  | 'noisy_counter_last'
  | 'adaptive_random_bias'
  | 'bayesian_markov'
  | 'frequency_matcher'
  | 'counter_least_frequent'
  | 'pattern_matcher_ngram'
  | 'markov_order_2'
  | 'epsilon_greedy_counter'
  | 'thompson_sampling'
  | 'ucb_bandit'
  | 'fictitious_play'
  | 'regret_matching'
  | 'meta_strategy_selector'
  | 'entropy_maximizer'
  | 'exploit_then_randomize'
  | 'counter_cycle_detector'
  | 'q_learning_tabular'
  | 'dummy_model'
  | 'external_model'
  | 'hybrid_mix';

export type Policy = Record<Move, number>;

export type StrategyGenome = {
  weights: Partial<Record<StrategyId, number>>;
  mutationRate: number;
  noise: number;
  memoryWindow: number;
  temperature: number;
};

export type RoundRecord = {
  matchId: string;
  roundIndex: number;
  opponentId: string;
  selfMove: Move;
  opponentMove: Move;
  result: RoundResult;
};

export type Player = {
  id: string;
  name: string;
  strategyType: StrategyId;
  elo: number;
  eloHistory: number[];
  score: number;
  wins: number;
  losses: number;
  draws: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  streak: number;
  totalRounds: number;
  lastMove?: Move;
  history: RoundRecord[];
  genome?: StrategyGenome;
  color: string;
  avatar: string;
  connectedModel?: boolean;
};

export type Round = {
  index: number;
  moveA: Move;
  moveB: Move;
  resultA: RoundResult;
  resultB: RoundResult;
};

export type Match = {
  id: string;
  index: number;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  strategyA: StrategyId;
  strategyB: StrategyId;
  rounds: Round[];
  winnerId?: string;
  scoreA: number;
  scoreB: number;
  eloDeltaA: number;
  eloDeltaB: number;
};

export type ArenaConfig = {
  playerCount: number;
  roundsPerMatch: number;
  tournamentType: TournamentType;
  crossoverPercent: number;
  mutationRate: number;
  includeDummyModel: boolean;
  simulationSpeed: number;
  eloK: number;
  recentWindow: number;
};

export type ArenaMetrics = {
  totalMatches: number;
  totalRounds: number;
  bestElo: number;
  averageElo: number;
  dummyElo?: number;
  averageEntropy: number;
  highestWinRate: number;
};

export type StrategyDescriptor = {
  id: StrategyId;
  label: string;
  family: 'baseline' | 'memory' | 'predictive' | 'adaptive' | 'learning' | 'model' | 'hybrid';
  description: string;
};
