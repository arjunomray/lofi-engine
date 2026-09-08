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
  let currentSong = $state<GeneratedSong | null>(null);
  let isPlaying = $state(false);
  let showSettings = $state(false);
  let transitionNotice = $state('');
  let currentMode = $state<VisualizerMode>('bars_and_waves');

  // DSP Controls
  let params = $state<LoFiDSPParams>({ ...DEFAULT_DSP_PARAMS });

  // Engine & Visualizer Component Ref
  let engine = $state<AudioEngine | null>(null);
  let visualizerRef = $state<any>(null);

  onMount(() => {
    engine = new AudioEngine();
    
    // Auto-Evolve with 50/50 chance for 1 or 2 loops
    engine.setAutoEvolve(true, 2, (newSong) => {
      currentSong = newSong;
      seedInput = String(newSong.seed);
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
    currentSong = LoFiGenerator.generate({ seed: cleanSeed });
    if (isPlaying && engine) {
      engine.play(currentSong);
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
      case 'bars_and_waves': return 'Bars & Waves';
      case 'neon_scope': return 'Neon Scope';
      case 'radial_alchemy': return 'Radial Alchemy';
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
      onModeChanged={(m) => currentMode = m}
    />
  {/if}

  <!-- 2. MINIMAL TOP HUD -->
  <TopBar 
    seed={seedInput}
    {isPlaying}
    currentMode={formatModeName(currentMode)}
    onRollSeed={rollNewSeed}
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
    background-color: #080503;
    background: 
      radial-gradient(ellipse 75% 65% at 50% 38%, rgba(55, 32, 17, 0.45) 0%, rgba(22, 13, 8, 0.8) 55%, #070403 100%),
      radial-gradient(circle at 10% 90%, rgba(180, 83, 9, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 90% 10%, rgba(217, 119, 6, 0.06) 0%, transparent 40%);
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
