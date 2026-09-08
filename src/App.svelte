<script lang="ts">
  import { onMount } from 'svelte';
  import { LoFiGenerator } from './generator/index.js';
  import type { GeneratedSong } from './generator/types.js';
  import { AudioEngine } from './audio/AudioEngine.js';
  import { DEFAULT_DSP_PARAMS } from './audio/types.js';
  import type { LoFiDSPParams } from './audio/types.js';
  import type { VisualizerMode } from './visualizer/wmpRenderer.js';

  // Components
  import Visualizer from './components/Visualizer.svelte';
  import TopBar from './components/TopBar.svelte';
  import ControlsDock from './components/ControlsDock.svelte';
  import DSPPanel from './components/DSPPanel.svelte';
  import CrossfadeToast from './components/CrossfadeToast.svelte';

  // State
  let seedInput = $state('rainy-tokyo');
  let recentSeeds = $state<string[]>(['rainy-tokyo']);
  let currentSong = $state<GeneratedSong | null>(null);
  let isPlaying = $state(false);
  let showSettings = $state(false);
  let transitionNotice = $state('');
  let currentMode = $state<VisualizerMode>('vintage_vinyl');

  // DSP Controls
  let params = $state<LoFiDSPParams>({ ...DEFAULT_DSP_PARAMS });

  // Engine & Visualizer Component Ref
  let engine = $state<AudioEngine | null>(null);
  let visualizerRef = $state<any>(null);

  function recordSeed(seed: string) {
    const clean = seed.trim();
    if (!clean) return;
    recentSeeds = [clean, ...recentSeeds.filter(s => s !== clean)].slice(0, 5);
  }

  onMount(() => {
    engine = new AudioEngine();
    
    // Auto-Evolve with 50/50 chance for 1 or 2 loops
    engine.setAutoEvolve(true, 2, (newSong) => {
      currentSong = newSong;
      seedInput = String(newSong.seed);
      recordSeed(seedInput);
      transitionNotice = `Crossfaded to "${newSong.seed}"`;
      setTimeout(() => {
        transitionNotice = '';
      }, 3500);
    });

    generateSong(seedInput);
  });

  function generateSong(seed: string) {
    const cleanSeed = seed.trim() || 'lofi-vibe';
    seedInput = cleanSeed;
    recordSeed(cleanSeed);
    currentSong = LoFiGenerator.generate({ seed: cleanSeed });
    if (isPlaying && engine) {
      engine.play(currentSong);
    }
  }

  function handleSetSeed(newSeed: string) {
    generateSong(newSeed);
    if (!isPlaying) {
      togglePlay();
    }
  }

  function rollNewSeed() {
    const moods = [
      'rainy-tokyo', 'midnight-chill', 'coffee-study', 'cloudy-afternoon',
      'dusty-vinyl', 'cassette-rewind', 'autumn-leaves', 'sunset-drive',
      'neon-shinjuku', 'sleeping-cat', 'warm-breeze', 'lofi-cafe'
    ];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const newSeed = `${mood}-${num}`;
    generateSong(newSeed);
    if (!isPlaying) {
      togglePlay();
    }
  }

  async function togglePlay() {
    if (!currentSong || !engine) return;

    if (isPlaying) {
      engine.stop();
      isPlaying = false;
    } else {
      await engine.play(currentSong);
      isPlaying = true;
    }
  }

  function handleModeCycle() {
    if (visualizerRef) {
      currentMode = visualizerRef.cycleMode();
    }
  }

  function handleParamChange(key: keyof LoFiDSPParams, value: number) {
    params[key] = value;
    engine.updateParams({ [key]: value });
  }

  function formatModeName(m: VisualizerMode): string {
    switch (m) {
      case 'vintage_vinyl': return 'Vintage Vinyl';
      case 'cassette_tape': return 'Cassette Tape';
      case 'analog_scope': return 'Analog Scope';
    }
  }
</script>

<div class="player-container">
  <!-- 1. FULLSCREEN CANVAS VISUALIZER -->
  {#if engine}
    <Visualizer 
      bind:this={visualizerRef}
      {engine}
      {isPlaying}
      seed={seedInput}
      onModeChanged={(m) => currentMode = m}
    />
  {/if}

  <!-- 2. MINIMAL TOP HUD -->
  <TopBar 
    seed={seedInput}
    {isPlaying}
    currentMode={formatModeName(currentMode)}
    {recentSeeds}
    onRollSeed={rollNewSeed}
    onSetSeed={handleSetSeed}
    onCycleMode={handleModeCycle}
  />

  <!-- 3. CROSSFADE NOTIFICATION TOAST -->
  <CrossfadeToast notice={transitionNotice} />

  <!-- 4. FLOATING BOTTOM CONTROLS -->
  <footer class="bottom-hud">
    <!-- Expandable DSP Knobs Panel -->
    {#if showSettings}
      <DSPPanel 
        {params}
        onParamChange={handleParamChange}
        onClose={() => showSettings = false}
      />
    {/if}

    <!-- Central Controls Pill -->
    <ControlsDock 
      {isPlaying}
      {showSettings}
      onTogglePlay={togglePlay}
      onToggleSettings={() => showSettings = !showSettings}
      onNextBeat={rollNewSeed}
    />
  </footer>
</div>

<style>
  .player-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #080411;
    background: 
      radial-gradient(ellipse 75% 65% at 50% 38%, rgba(68, 22, 110, 0.45) 0%, rgba(20, 9, 36, 0.85) 55%, #06020c 100%),
      radial-gradient(circle at 12% 88%, rgba(255, 0, 127, 0.09) 0%, transparent 45%),
      radial-gradient(circle at 88% 12%, rgba(0, 240, 255, 0.08) 0%, transparent 45%);
  }

  .bottom-hud {
    position: absolute;
    bottom: 28px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    z-index: 20;
    pointer-events: none;
    padding: 0 16px;
  }
</style>
