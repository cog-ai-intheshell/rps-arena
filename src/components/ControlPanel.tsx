import type { ArenaConfig, TournamentType } from '../types';

type ControlPanelProps = {
  config: ArenaConfig;
  isPlaying: boolean;
  generation: number;
  onConfig: (patch: Partial<ArenaConfig>) => void;
  onGenerate: () => void;
  onTogglePlay: () => void;
  onStep: () => void;
  onRunBatch: () => void;
  onReset: () => void;
  onBreed: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

const tournamentTypes: { id: TournamentType; label: string }[] = [
  { id: 'round_robin', label: 'Round-robin' },
  { id: 'swiss', label: 'Swiss' },
  { id: 'knockout', label: 'Knockout' },
  { id: 'league_continuous', label: 'Continuous league' },
];

export function ControlPanel({
  config,
  isPlaying,
  generation,
  onConfig,
  onGenerate,
  onTogglePlay,
  onStep,
  onRunBatch,
  onReset,
  onBreed,
  onExport,
  onImport,
}: ControlPanelProps) {
  return (
    <aside className="sidebar" aria-label="RPS arena control panel">
      <div className="sidebar-inner">
        <header className="brand">
          <h1>RPS AI Arena</h1>
          <p>Train models against adaptive opponents</p>
        </header>

        <section className="control-section">
          <h2>POPULATION</h2>
          <label className="slider-field" htmlFor="playerCount">
            <span>Players</span>
            <output>{config.playerCount}</output>
            <input id="playerCount" type="range" min="4" max="64" step="1" value={config.playerCount} onChange={(event) => onConfig({ playerCount: Number(event.target.value) })} />
          </label>
          <label className="slider-field" htmlFor="roundsPerMatch">
            <span>Rounds per match</span>
            <output>{config.roundsPerMatch}</output>
            <input id="roundsPerMatch" type="range" min="3" max="101" step="2" value={config.roundsPerMatch} onChange={(event) => onConfig({ roundsPerMatch: Number(event.target.value) })} />
          </label>
          <label className="field-label select-field">
            <span>Tournament type</span>
            <select value={config.tournamentType} onChange={(event) => onConfig({ tournamentType: event.target.value as TournamentType })}>
              {tournamentTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="toggle-field" htmlFor="dummyModel">
            <span>Include dummy model</span>
            <input id="dummyModel" type="checkbox" checked={config.includeDummyModel} onChange={(event) => onConfig({ includeDummyModel: event.target.checked })} />
          </label>
          <button className="primary-button" type="button" onClick={onGenerate}>Generate population</button>
        </section>

        <section className="control-section">
          <h2>SIMULATION</h2>
          <div className="button-row">
            <button className="header-button full" type="button" onClick={onTogglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
            <button className="header-button full" type="button" onClick={onStep}>Step</button>
            <button className="header-button full" type="button" onClick={onRunBatch}>Batch</button>
          </div>
          <button className="secondary-button tight" type="button" onClick={onReset}>Reset scores</button>
          <label className="slider-field" htmlFor="simSpeed">
            <span>Simulation speed</span>
            <output>{config.simulationSpeed}x</output>
            <input id="simSpeed" type="range" min="1" max="30" step="1" value={config.simulationSpeed} onChange={(event) => onConfig({ simulationSpeed: Number(event.target.value) })} />
          </label>
          <label className="slider-field" htmlFor="eloK">
            <span>Elo K-factor</span>
            <output>{config.eloK}</output>
            <input id="eloK" type="range" min="8" max="64" step="1" value={config.eloK} onChange={(event) => onConfig({ eloK: Number(event.target.value) })} />
          </label>
        </section>

        <section className="control-section">
          <h2>HYBRIDIZATION</h2>
          <label className="slider-field" htmlFor="crossover">
            <span>Crossover</span>
            <output>{config.crossoverPercent}%</output>
            <input id="crossover" type="range" min="0" max="100" step="1" value={config.crossoverPercent} onChange={(event) => onConfig({ crossoverPercent: Number(event.target.value) })} />
          </label>
          <label className="slider-field" htmlFor="mutation">
            <span>Mutation rate</span>
            <output>{config.mutationRate.toFixed(2)}</output>
            <input id="mutation" type="range" min="0" max="0.35" step="0.01" value={config.mutationRate} onChange={(event) => onConfig({ mutationRate: Number(event.target.value) })} />
          </label>
          <label className="slider-field" htmlFor="recentWindow">
            <span>Recent window</span>
            <output>{config.recentWindow}</output>
            <input id="recentWindow" type="range" min="3" max="30" step="1" value={config.recentWindow} onChange={(event) => onConfig({ recentWindow: Number(event.target.value) })} />
          </label>
          <button className="secondary-button" type="button" onClick={onBreed}>Breed hybrids · gen {generation}</button>
        </section>

        <section className="control-section">
          <h2>IMPORT / EXPORT</h2>
          <div className="button-row two">
            <button className="header-button full" type="button" onClick={onExport}>Export JSON</button>
            <label className="import-label">
              Import JSON
              <input type="file" accept="application/json" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.currentTarget.value = '';
              }} />
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}
