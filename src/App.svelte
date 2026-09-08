<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { LoFiGenerator } from './generator/index.js';
  import type { GeneratedSong } from './generator/types.js';
  import { AudioEngine } from './audio/AudioEngine.js';
  import { DEFAULT_DSP_PARAMS } from './audio/types.js';
  import type { LoFiDSPParams } from './audio/types.js';
  import { WMPVisualizer } from './visualizer/wmpRenderer.js';
  import type { VisualizerMode } from './visualizer/wmpRenderer.js';

  // State
  let seedInput = $state('rainy-tokyo');
  let currentSong = $state<GeneratedSong | null>(null);
  let isPlaying = $state(false);
  let showSettings = $state(false);
  let transitionNotice = $state('');

  // DSP Controls
  let params = $state<LoFiDSPParams>({ ...DEFAULT_DSP_PARAMS });

  // Engine & Visualizer
  let canvasElement: HTMLCanvasElement;
  let visualizer: WMPVisualizer;
  let engine: AudioEngine;
  let animFrameId: number;
  let currentMode = $state<VisualizerMode>('bars_and_waves');

  onMount(() => {
    // 1. Initialize Canvas & Visualizer
    visualizer = new WMPVisualizer(canvasElement);
    handleResize();
    window.addEventListener('resize', handleResize);

    // 2. Initialize Audio Engine with Auto-Evolve (50/50 chance for 1 or 2 plays)
    engine = new AudioEngine();
    engine.setAutoEvolve(true, 2, (newSong) => {
      currentSong = newSong;
      seedInput = String(newSong.seed);
      transitionNotice = `Crossfaded to "${newSong.seed}"`;
      setTimeout(() => {
        transitionNotice = '';
      }, 3500);
    });

    generateSong(seedInput);

    // 3. 60 FPS Render Loop
    function loop() {
      if (visualizer && engine) {
        const visualData = engine.getVisualData();
        visualizer.render(visualData, isPlaying);
      }
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    if (engine) engine.stop();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  });

  function handleResize() {
    if (!canvasElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasElement.width = window.innerWidth * dpr;
    canvasElement.height = window.innerHeight * dpr;
  }

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

  function cycleVisualizerMode() {
    if (!visualizer) return;
    currentMode = visualizer.cycleMode();
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
  
  <!-- SCREEN-WIDE CANVAS VISUALIZER -->
  <canvas 
    bind:this={canvasElement} 
    class="fullscreen-canvas"
    onclick={cycleVisualizerMode}
    title="Click to cycle visualizer mode"
  ></canvas>

  <!-- SUBTLE VINTAGE CRT SCANLINE -->
  <div class="crt-overlay"></div>

  <!-- TOP HEADER HUD -->
  <header class="top-hud">
    <!-- Seed Name Button (Starts loop, rolls new seed) -->
    <div class="glass-pill seed-pill">
      <span class="status-dot {isPlaying ? 'active' : ''}"></span>
      <span class="seed-label font-mono">SEED:</span>
      <button 
        onclick={rollNewSeed}
        class="seed-btn font-mono"
        title="Click to roll new seed and start loop"
      >
        <span>{seedInput}</span>
        <span class="dice-icon">🎲</span>
      </button>
    </div>

    <!-- Visualizer Mode Switcher -->
    <button 
      onclick={cycleVisualizerMode}
      class="btn-glass font-mono"
      title="Cycle visualizer mode"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
      <span>{formatModeName(currentMode)}</span>
    </button>
  </header>

  <!-- CROSSFADE TOAST NOTIFICATION -->
  {#if transitionNotice}
    <div class="crossfade-toast toast-anim font-mono">
      <span class="pulse-dot"></span>
      <span>{transitionNotice}</span>
    </div>
  {/if}

  <!-- FLOATING BOTTOM CONTROLS DOCK -->
  <footer class="bottom-hud">
    
    <!-- EXPANDABLE DSP KNOBS PANEL -->
    {#if showSettings}
      <div class="glass-panel dsp-panel panel-anim font-mono">
        <div class="dsp-header">
          <span>LO-FI SOUND DESIGN</span>
          <button onclick={() => showSettings = false} class="close-btn">✕</button>
        </div>

        <div class="dsp-grid">
          <!-- Warmth -->
          <div class="dsp-item">
            <div class="dsp-label-row">
              <span class="dsp-name">WARMTH</span>
              <span class="dsp-val">{Math.round(params.filterCutoff / 100) / 10}k</span>
            </div>
            <input 
              type="range" 
              min="800" 
              max="9000" 
              step="100"
              value={params.filterCutoff} 
              oninput={(e) => handleParamChange('filterCutoff', Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <!-- Tape Wobble -->
          <div class="dsp-item">
            <div class="dsp-label-row">
              <span class="dsp-name">WOBBLE</span>
              <span class="dsp-val">{Math.round(params.tapeWobbleDepth * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05"
              value={params.tapeWobbleDepth} 
              oninput={(e) => handleParamChange('tapeWobbleDepth', Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <!-- Vinyl Crackle -->
          <div class="dsp-item">
            <div class="dsp-label-row">
              <span class="dsp-name">VINYL</span>
              <span class="dsp-val">{Math.round(params.vinylVolume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="0.8" 
              step="0.05"
              value={params.vinylVolume} 
              oninput={(e) => handleParamChange('vinylVolume', Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <!-- Sidechain Pump -->
          <div class="dsp-item">
            <div class="dsp-label-row">
              <span class="dsp-name">PUMP</span>
              <span class="dsp-val">{Math.round(params.sidechainStrength * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05"
              value={params.sidechainStrength} 
              oninput={(e) => handleParamChange('sidechainStrength', Number((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>
      </div>
    {/if}

    <!-- CENTRAL CONTROLS PILL -->
    <div class="glass-pill control-pill">
      
      <!-- DSP Knobs Toggle Button -->
      <button 
        onclick={() => showSettings = !showSettings}
        class="btn-icon {showSettings ? 'active' : ''}"
        title="Toggle DSP sound knobs"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
      </button>

      <!-- MAIN PLAY / PAUSE BUTTON -->
      <button 
        onclick={togglePlay}
        class="btn-play {isPlaying ? 'playing' : ''}"
      >
        {#if isPlaying}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          <span>PAUSE</span>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <span>PLAY LO-FI</span>
        {/if}
      </button>

      <!-- Next Beat / Roll Button -->
      <button 
        onclick={rollNewSeed}
        class="btn-icon"
        title="Next Beat (Roll Seed)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="5 4 15 12 5 20"></polyline>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>
    </div>

  </footer>
</div>

<style>
  .player-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #06070a;
  }

  .fullscreen-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    cursor: pointer;
  }

  .crt-overlay {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.22) 50%);
    background-size: 100% 4px;
    z-index: 5;
    opacity: 0.3;
  }

  .top-hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 20;
    pointer-events: none;
  }

  .top-hud > * {
    pointer-events: auto;
  }

  .seed-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 9999px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #52525b;
    transition: background 0.3s;
  }

  .status-dot.active {
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
  }

  .seed-label {
    font-size: 11px;
    color: #71717a;
    letter-spacing: 0.05em;
  }

  .seed-btn {
    background: transparent;
    border: none;
    color: #f59e0b;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .seed-btn:hover {
    color: #fbbf24;
  }

  .dice-icon {
    font-size: 12px;
    opacity: 0.8;
  }

  .crossfade-toast {
    position: absolute;
    top: 85px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    padding: 10px 20px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #fcd34d;
    border-radius: 9999px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(16px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 8px #f59e0b;
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

  .bottom-hud > * {
    pointer-events: auto;
  }

  .control-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 14px;
    border-radius: 9999px;
  }

  .dsp-panel {
    width: 100%;
    max-width: 520px;
    padding: 20px 24px;
    border-radius: 20px;
    font-size: 12px;
  }

  .dsp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #a1a1aa;
    font-weight: 600;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #71717a;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: #e4e4e7;
  }

  .dsp-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (min-width: 500px) {
    .dsp-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .dsp-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dsp-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
  }

  .dsp-name {
    color: #a1a1aa;
  }

  .dsp-val {
    color: #f59e0b;
    font-weight: 600;
  }
</style>
