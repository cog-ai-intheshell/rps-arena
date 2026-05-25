# RPS AI Arena

Interactive Rock Paper Scissors arena for simulating, comparing and later training AI agents against a population of scripted, adaptive and hybrid strategies.

## Launch

```bash
cd /Users/augustinmorieux/Desktop/dum-e/rps-arena
npm install
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173/
```

If the port is busy:

```bash
npm run dev -- --port 5175
```

## Build

```bash
npm run build
```

## Features

- Generate a population of RPS agents.
- Choose player count, rounds per match, tournament type and simulation speed.
- Tournament modes: round-robin, Swiss, knockout-like pairing and continuous league.
- Play, pause, step and batch simulation.
- Elo update after each match.
- Dummy model slot to visualize the future model pipeline.
- Hybrid strategies with genome weights, crossover and mutation.
- Leaderboard with Elo and winrate.
- Tournament arena with recent match cards.
- Elo curve.
- Move distribution.
- Strategy DNA viewer.
- Matchup matrix.
- Player and match inspector.
- Import/export JSON.
- Light/dark mode.

## Strategy Families

The arena includes baseline, memory, predictive, adaptive, learning, hybrid and model-placeholder strategies.

Examples:

- `random`
- `biased_rock`
- `cycle`
- `copy_last`
- `counter_last`
- `win_stay_lose_shift`
- `counter_most_frequent`
- `markov_predictor`
- `bayesian_markov`
- `pattern_matcher_ngram`
- `regret_matching`
- `q_learning_tabular`
- `dummy_model`
- `hybrid_mix`

## Project Structure

```text
rps-arena/
  src/
    App.tsx
    main.tsx
    styles.css
    types.ts
    engine/
      arena.ts
      strategies.ts
    components/
      Charts.tsx
      ControlPanel.tsx
      Inspector.tsx
      Leaderboard.tsx
      TournamentView.tsx
```

## Future Model Hook

The current `dummy_model` strategy mocks a model endpoint by returning random logits. Later, it can be replaced by an async model adapter receiving:

```ts
{
  selfHistory,
  opponentHistory,
  roundIndex,
  scoreSelf,
  scoreOpponent,
  opponentId,
  tournamentState
}
```

and returning:

```ts
{
  move: 'rock' | 'paper' | 'scissors',
  confidence: number,
  logits?: {
    rock: number,
    paper: number,
    scissors: number
  }
}
```
