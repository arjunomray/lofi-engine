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
      case 'neon_scope': return 'Neon Oscilloscope';
      case 'radial_alchemy': return 'Radial Alchemy';
    }
  }
</script>

<!-- Fullscreen Container -->
<div class="relative w-screen h-screen overflow-hidden bg-[#07090d] select-none font-sans text-zinc-100">
  
  <!-- SCREEN-WIDE WINDOWS MEDIA PLAYER CANVAS -->
  <canvas 
    bind:this={canvasElement} 
    class="absolute inset-0 w-full h-full block cursor-pointer"
    onclick={cycleVisualizerMode}
    title="Click anywhere to cycle visualizer mode"
  ></canvas>

  <!-- VINTAGE CRT SCANLINE OVERLAY -->
  <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10 opacity-35"></div>

  <!-- MINIMAL TOP HUD BAR -->
  <header class="absolute top-0 inset-x-0 p-4 md:p-6 z-20 flex items-center justify-between pointer-events-none">
    
    <!-- Seed Name Button (Starts loop, rolls new seed) -->
    <div class="pointer-events-auto flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 rounded-full px-4 py-2 backdrop-blur-md transition-all shadow-xl">
      <span class="w-2 h-2 rounded-full {isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'}"></span>
      <span class="text-xs font-mono text-zinc-400">SEED:</span>
      <button 
        onclick={rollNewSeed}
        class="text-xs font-mono font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
        title="Click to roll a new seed and start loop"
      >
        <span>{seedInput}</span>
        <span class="text-[10px] text-zinc-400">🎲</span>
      </button>
    </div>

    <!-- Visualizer Mode Switcher -->
    <button 
      onclick={cycleVisualizerMode}
      class="pointer-events-auto px-3.5 py-2 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 rounded-full text-xs font-mono text-zinc-300 backdrop-blur-md transition-all shadow-xl flex items-center gap-2 cursor-pointer"
      title="Switch Visualizer View"
    >
      <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
      <span>{formatModeName(currentMode)}</span>
    </button>
  </header>

  <!-- CROSSFADE TOAST NOTIFICATION -->
  {#if transitionNotice}
    <div class="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-mono backdrop-blur-lg flex items-center gap-2 shadow-2xl animate-fade-in pointer-events-none">
      <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
      <span>{transitionNotice}</span>
    </div>
  {/if}

  <!-- FLOATING MINIMAL PLAYER DECK (BOTTOM) -->
  <footer class="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center gap-4 px-4 pointer-events-none">
    
    <!-- DSP KNOBS PANEL (Expandable / Sleek) -->
    {#if showSettings}
      <div class="pointer-events-auto w-full max-w-xl bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-2xl font-mono text-xs animate-scale-up">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <span class="text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">Lo-Fi Sound Design (DSP)</span>
          <button 
            onclick={() => showSettings = false} 
            class="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <!-- Warmth (Filter Cutoff) -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">WARMTH</span>
              <span class="text-amber-400">{Math.round(params.filterCutoff / 1000)}k</span>
            </div>
            <input 
              type="range" 
              min="800" 
              max="9000" 
              step="100"
              value={params.filterCutoff} 
              oninput={(e) => handleParamChange('filterCutoff', Number((e.target as HTMLInputElement).value))}
              class="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          <!-- Tape Wobble -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">WOBBLE</span>
              <span class="text-amber-400">{Math.round(params.tapeWobbleDepth * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05"
              value={params.tapeWobbleDepth} 
              oninput={(e) => handleParamChange('tapeWobbleDepth', Number((e.target as HTMLInputElement).value))}
              class="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          <!-- Vinyl Crackle -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">VINYL</span>
              <span class="text-amber-400">{Math.round(params.vinylVolume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="0.8" 
              step="0.05"
              value={params.vinylVolume} 
              oninput={(e) => handleParamChange('vinylVolume', Number((e.target as HTMLInputElement).value))}
              class="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          <!-- Sidechain Pump -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">PUMP</span>
              <span class="text-amber-400">{Math.round(params.sidechainStrength * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05"
              value={params.sidechainStrength} 
              oninput={(e) => handleParamChange('sidechainStrength', Number((e.target as HTMLInputElement).value))}
              class="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>
        </div>
      </div>
    {/if}

    <!-- CENTRAL CONTROLS PILL -->
    <div class="pointer-events-auto flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 rounded-full px-5 py-2.5 backdrop-blur-xl shadow-2xl">
      
      <!-- Quick DSP Knobs Toggle -->
      <button 
        onclick={() => showSettings = !showSettings}
        class="p-2.5 rounded-full {showSettings ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'} transition-colors cursor-pointer"
        title="Toggle Sound Design (DSP Knobs)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        class="px-7 py-3 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg {isPlaying ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-500/25' : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-white/10'}"
      >
        {#if isPlaying}
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          <span>Pause</span>
        {:else}
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <span>Play</span>
        {/if}
      </button>

      <!-- Roll Next Seed Button -->
      <button 
        onclick={rollNewSeed}
        class="p-2.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
        title="Next Beat (Roll Seed)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="5 4 15 12 5 20"></polyline>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>
    </div>

  </footer>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
</style>
