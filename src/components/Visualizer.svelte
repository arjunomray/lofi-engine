<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WMPVisualizer } from '../visualizer/wmpRenderer.js';
  import type { VisualizerMode } from '../visualizer/wmpRenderer.js';
  import { AudioEngine } from '../audio/AudioEngine.js';

  export let engine: AudioEngine;
  export let isPlaying: boolean;
  export let seed: string = 'lofi-vibe';
  export let onModeChanged: ((mode: VisualizerMode) => void) | undefined = undefined;

  let canvasElement: HTMLCanvasElement;
  let visualizer: WMPVisualizer;
  let animFrameId: number;

  onMount(() => {
    visualizer = new WMPVisualizer(canvasElement);
    handleResize();
    window.addEventListener('resize', handleResize);

    function loop() {
      if (visualizer && engine) {
        const visualData = engine.getVisualData();
        visualizer.render(visualData, isPlaying, seed);
      }
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
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

  export function cycleMode(): VisualizerMode {
    if (!visualizer) return 'car_backseat';
    const nextMode = visualizer.cycleMode();
    if (onModeChanged) onModeChanged(nextMode);
    return nextMode;
  }
</script>

<canvas 
  bind:this={canvasElement} 
  class="fullscreen-canvas"
></canvas>

<div class="crt-overlay"></div>

<style>
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
    /* Synthwave neon-CRT framing + micro cyan/magenta scanlines */
    background: 
      radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(20, 8, 38, 0.45) 75%, rgba(6, 2, 14, 0.9) 100%),
      linear-gradient(rgba(0, 240, 255, 0.015) 50%, rgba(0, 0, 0, 0.2) 50%);
    background-size: 100% 100%, 100% 4px;
    box-shadow: inset 0 0 100px rgba(8, 2, 16, 0.85);
    z-index: 5;
    opacity: 0.85;
  }
</style>
