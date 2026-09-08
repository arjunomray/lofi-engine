<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { LoFiGenerator } from './generator/index.js';
  import type { GeneratedSong } from './generator/types.js';
  import { AudioEngine } from './audio/AudioEngine.js';
  import { DEFAULT_DSP_PARAMS } from './audio/types.js';
  import type { LoFiDSPParams } from './audio/types.js';

  // State
  let seedInput = $state('rainy-tokyo');
  let currentSong = $state<GeneratedSong | null>(null);
  let isPlaying = $state(false);

  // Loop & Auto-Evolve Mode
  let autoEvolve = $state(true);
  let loopsBeforeEvolve = $state(2); // Evolve after 1 or 2 loops
  let transitionToast = $state('');
  let isTransitioning = $state(false);

  // DSP Controls
  let params = $state<LoFiDSPParams>({ ...DEFAULT_DSP_PARAMS });

  // Audio Engine Instance
  let engine: AudioEngine;
  let animFrameId: number;

  // Real-time Visual Energy
  let bassEnergy = $state(0);
  let midEnergy = $state(0);
  let highEnergy = $state(0);

  onMount(() => {
    engine = new AudioEngine();
    
    // Configure Auto-Evolve callback
    engine.setAutoEvolve(autoEvolve, loopsBeforeEvolve, (newSong) => {
      currentSong = newSong;
      seedInput = String(newSong.seed);
      isTransitioning = true;
      transitionToast = `🎧 Crossfaded to new seed: "${newSong.seed}"`;
      setTimeout(() => {
        isTransitioning = false;
      }, 2500);
      setTimeout(() => {
        transitionToast = '';
      }, 4500);
    });

    generateNewSong();

    // 60 FPS Visual Meter Loop
    function updateVisuals() {
      if (isPlaying && engine) {
        const visualData = engine.getVisualData();
        bassEnergy = visualData.bass;
        midEnergy = visualData.mids;
        highEnergy = visualData.highs;
      } else {
        bassEnergy *= 0.9;
        midEnergy *= 0.9;
        highEnergy *= 0.9;
      }
      animFrameId = requestAnimationFrame(updateVisuals);
    }
    animFrameId = requestAnimationFrame(updateVisuals);
  });

  onDestroy(() => {
    if (engine) engine.stop();
    if (animFrameId) cancelAnimationFrame(animFrameId);
  });

  function generateNewSong() {
    currentSong = LoFiGenerator.generate({
      seed: seedInput.trim() || 'lofi-vibe'
    });
    if (isPlaying && engine) {
      engine.play(currentSong);
    }
  }

  function randomizeSeed() {
    const moods = ['midnight-drive', 'rainy-kyoto', 'coffee-study', 'cloudy-afternoon', 'dusty-vinyl', 'cassette-42', 'autumn-leaves', 'nostalgia'];
    seedInput = `${moods[Math.floor(Math.random() * moods.length)]}-${Math.floor(Math.random() * 999)}`;
    generateNewSong();
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

  function toggleAutoEvolve() {
    autoEvolve = !autoEvolve;
    if (engine) {
      engine.setAutoEvolve(autoEvolve, loopsBeforeEvolve);
    }
  }

  function setLoopCycle(count: number) {
    loopsBeforeEvolve = count;
    if (engine) {
      engine.setAutoEvolve(autoEvolve, loopsBeforeEvolve);
    }
  }

  function handleParamChange(key: keyof LoFiDSPParams, value: number) {
    params[key] = value;
    engine.updateParams({ [key]: value });
  }
</script>

<main class="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-amber-500/20">
  <!-- Container Card -->
  <div class="w-full max-w-2xl bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
    
    <!-- Crossfade Glow Indicator Banner -->
    {#if transitionToast}
      <div class="mb-4 px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-mono flex items-center justify-between animate-fade-in">
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          {transitionToast}
        </span>
        <span class="text-[10px] text-amber-400/80 uppercase tracking-widest font-semibold">Crossfading</span>
      </div>
    {/if}

    <!-- Header -->
    <header class="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full {isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}"></span>
          <h1 class="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 font-mono">Lo-Fi Web Audio Engine</h1>
        </div>
        <p class="text-xs md:text-sm text-zinc-400 mt-1">Real-time Web Audio Synthesizer & Auto-Evolve Loop Mode</p>
      </div>
      <div class="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono rounded-full">
        100% Client-Side
      </div>
    </header>

    <!-- Auto-Evolve Loop Mode Banner / Controls -->
    <section class="mb-6 p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button 
          onclick={toggleAutoEvolve}
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {autoEvolve ? 'bg-amber-500' : 'bg-zinc-700'}"
          role="switch"
          aria-checked={autoEvolve}
          title="Toggle Auto-Evolve Loop Mode"
        >
          <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out {autoEvolve ? 'translate-x-5' : 'translate-x-0'}"></span>
        </button>
        <div>
          <div class="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
            <span>Infinite Radio (Auto-Evolve)</span>
            {#if autoEvolve}
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {/if}
          </div>
          <p class="text-[10px] text-zinc-400">Plays seed 1-2 times, then crossfades to a new beat</p>
        </div>
      </div>

      <!-- Loop Duration Selector -->
      {#if autoEvolve}
        <div class="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/60 rounded-lg p-1 self-start sm:self-auto text-[11px] font-mono">
          <span class="text-zinc-400 px-1.5 text-[10px]">Change every:</span>
          <button 
            onclick={() => setLoopCycle(1)}
            class="px-2 py-0.5 rounded cursor-pointer transition-colors {loopsBeforeEvolve === 1 ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            1 loop (~12s)
          </button>
          <button 
            onclick={() => setLoopCycle(2)}
            class="px-2 py-0.5 rounded cursor-pointer transition-colors {loopsBeforeEvolve === 2 ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            2 loops (~25s)
          </button>
        </div>
      {/if}
    </section>

    <!-- Seed & Generation Control -->
    <section class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <label for="seed-input" class="text-xs font-mono uppercase tracking-wider text-zinc-400">Active Seed (DNA)</label>
        {#if autoEvolve}
          <span class="text-[10px] font-mono text-amber-400/90 animate-pulse">Auto-updating on loop cycle</span>
        {/if}
      </div>
      <div class="flex gap-2">
        <input 
          id="seed-input"
          type="text" 
          bind:value={seedInput}
          placeholder="Enter seed (e.g. rainy-tokyo, 42)"
          class="flex-1 bg-zinc-950/80 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm font-mono text-amber-200 focus:outline-none focus:border-amber-400/80 transition-colors {isTransitioning ? 'border-amber-400 ring-2 ring-amber-400/20' : ''}"
          onkeydown={(e) => e.key === 'Enter' && generateNewSong()}
        />
        <button 
          onclick={generateNewSong}
          class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          title="Regenerate with current seed"
        >
          Apply
        </button>
        <button 
          onclick={randomizeSeed}
          class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          title="Pick random seed"
        >
          🎲 Roll
        </button>
      </div>
    </section>

    <!-- Metadata Display -->
    {#if currentSong}
      <section class="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 mb-6 font-mono text-xs space-y-1.5 transition-all {isTransitioning ? 'border-amber-500/50 shadow-md shadow-amber-500/10' : ''}">
        <div class="flex justify-between">
          <span class="text-zinc-500">Progression:</span>
          <span class="text-amber-300 font-semibold truncate max-w-[340px]">{currentSong.progression}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Comping Style:</span>
          <span class="text-emerald-400 uppercase font-semibold">{currentSong.compingStyle}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Drum Groove:</span>
          <span class="text-sky-400 uppercase font-semibold">{currentSong.drumStyle}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Tempo / Bars:</span>
          <span class="text-zinc-300">{currentSong.bpm} BPM &bull; {currentSong.bars} Bars (~{currentSong.totalDurationSeconds.toFixed(1)}s loop)</span>
        </div>
      </section>
    {/if}

    <!-- Main Transport Play Button & Energy Meters -->
    <section class="flex flex-col sm:flex-row items-center gap-4 mb-8">
      <button 
        onclick={togglePlay}
        class="w-full sm:w-auto px-8 py-3.5 {isPlaying ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' : 'bg-zinc-100 hover:bg-white text-zinc-950'} font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
      >
        {#if isPlaying}
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          Pause Playback
        {:else}
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Play Lo-Fi Beat
        {/if}
      </button>

      <!-- Real-time Reactive Frequency Meters -->
      <div class="flex-1 w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-around gap-2 font-mono text-[10px] text-zinc-400">
        <div class="flex-1 flex flex-col items-center gap-1">
          <span>BASS</span>
          <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 transition-all duration-75" style="width: {Math.min(100, bassEnergy * 180)}%"></div>
          </div>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <span>MIDS</span>
          <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-400 transition-all duration-75" style="width: {Math.min(100, midEnergy * 180)}%"></div>
          </div>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <span>HIGHS</span>
          <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-sky-400 transition-all duration-75" style="width: {Math.min(100, highEnergy * 220)}%"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Real-time DSP Control Sliders -->
    <section class="border-t border-zinc-800 pt-6">
      <h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">Lo-Fi Sound Design (DSP Knobs)</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <!-- Lowpass Filter Cutoff -->
        <div class="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
          <div class="flex justify-between mb-1">
            <span class="text-zinc-300">Warmth (Filter Cutoff)</span>
            <span class="text-amber-400">{params.filterCutoff} Hz</span>
          </div>
          <input 
            type="range" 
            min="800" 
            max="9000" 
            step="100"
            value={params.filterCutoff} 
            oninput={(e) => handleParamChange('filterCutoff', Number((e.target as HTMLInputElement).value))}
            class="w-full accent-amber-400 cursor-pointer"
          />
          <p class="text-[10px] text-zinc-500 mt-1">Cuts digital highs for vintage muffled tone</p>
        </div>

        <!-- Tape Wow & Flutter -->
        <div class="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
          <div class="flex justify-between mb-1">
            <span class="text-zinc-300">Tape Wow & Flutter</span>
            <span class="text-amber-400">{Math.round(params.tapeWobbleDepth * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.0" 
            max="1.0" 
            step="0.05"
            value={params.tapeWobbleDepth} 
            oninput={(e) => handleParamChange('tapeWobbleDepth', Number((e.target as HTMLInputElement).value))}
            class="w-full accent-amber-400 cursor-pointer"
          />
          <p class="text-[10px] text-zinc-500 mt-1">LFO pitch wobble of worn cassette tape</p>
        </div>

        <!-- Vinyl Crackle Volume -->
        <div class="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
          <div class="flex justify-between mb-1">
            <span class="text-zinc-300">Vinyl Dust & Crackle</span>
            <span class="text-amber-400">{Math.round(params.vinylVolume * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.0" 
            max="0.8" 
            step="0.05"
            value={params.vinylVolume} 
            oninput={(e) => handleParamChange('vinylVolume', Number((e.target as HTMLInputElement).value))}
            class="w-full accent-amber-400 cursor-pointer"
          />
          <p class="text-[10px] text-zinc-500 mt-1">Continuous needle hiss and dust pops</p>
        </div>

        <!-- Sidechain Pump -->
        <div class="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
          <div class="flex justify-between mb-1">
            <span class="text-zinc-300">Sidechain Ducking</span>
            <span class="text-amber-400">{Math.round(params.sidechainStrength * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.0" 
            max="1.0" 
            step="0.05"
            value={params.sidechainStrength} 
            oninput={(e) => handleParamChange('sidechainStrength', Number((e.target as HTMLInputElement).value))}
            class="w-full accent-amber-400 cursor-pointer"
          />
          <p class="text-[10px] text-zinc-500 mt-1">Ducks piano chords when kick triggers</p>
        </div>
      </div>
    </section>

  </div>
</main>
