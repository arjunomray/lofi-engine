<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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
  import InfoModal from './components/InfoModal.svelte';

  // State
  let seedInput = $state('rainy-tokyo');
  let recentSeeds = $state<string[]>(['rainy-tokyo']);
  let currentSong = $state<GeneratedSong | null>(null);
  let isPlaying = $state(false);
  let showSettings = $state(false);
  let showInfoModal = $state(false);
  let transitionNotice = $state('');
  let currentMode = $state<VisualizerMode>('car_backseat');

  // DSP Controls
  let params = $state<LoFiDSPParams>({ ...DEFAULT_DSP_PARAMS });

  // Engine & Component Refs
  let engine = $state<AudioEngine | null>(null);
  let visualizerRef = $state<any>(null);
  let topBarRef = $state<any>(null);

  function recordSeed(seed: string) {
    const clean = seed.trim();
    if (!clean) return;
    recentSeeds = [clean, ...recentSeeds.filter(s => s !== clean)].slice(0, 5);
  }

  function handleGlobalKeyDown(e: KeyboardEvent) {
    // Ignore keyboard shortcuts when typing in an input, textarea, or contentEditable
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const key = e.key.toLowerCase();

    if (key === 'p') {
      e.preventDefault();
      togglePlay();
    } else if (key === 'n') {
      e.preventDefault();
      rollNewSeed();
    } else if (key === 'v') {
      e.preventDefault();
      handleModeCycle();
    } else if (key === 's') {
      e.preventDefault();
      topBarRef?.toggleSeedMenu();
    } else if (key === 'd') {
      e.preventDefault();
      showSettings = !showSettings;
    } else if (key === 'i') {
      e.preventDefault();
      showInfoModal = !showInfoModal;
    } else if (e.key === 'Escape') {
      if (showInfoModal) showInfoModal = false;
      if (showSettings) showSettings = false;
      topBarRef?.closeSeedMenu();
    }
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

    window.addEventListener('keydown', handleGlobalKeyDown);
    generateSong(seedInput);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    }
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
      case 'car_backseat': return 'Car Backseat';
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
    bind:this={topBarRef}
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

  <!-- 5. BOTTOM-LEFT INFO & SHORTCUTS BUTTON -->
  <aside class="info-corner">
    <button 
      onclick={() => showInfoModal = !showInfoModal}
      class="btn-glass btn-info {showInfoModal ? 'active' : ''}"
      title="Shortcuts & System Info (Press I)"
      aria-label="Shortcuts & Info"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span class="font-mono">INFO</span>
    </button>
  </aside>

  <!-- 6. INFO & SHORTCUTS MODAL -->
  <InfoModal 
    show={showInfoModal} 
    onClose={() => showInfoModal = false} 
  />
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

  .info-corner {
    position: absolute;
    bottom: 28px;
    left: 28px;
    z-index: 25;
    pointer-events: auto;
  }

  .btn-info {
    padding: 8px 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: #a79bbd;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-info:hover, .btn-info.active {
    color: #00f0ff;
    border-color: rgba(0, 240, 255, 0.45);
    box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  }
</style>
