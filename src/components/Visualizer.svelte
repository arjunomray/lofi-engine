<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WMPVisualizer } from '../visualizer/wmpRenderer.js';
  import type { VisualizerMode } from '../visualizer/wmpRenderer.js';
  import { AudioEngine } from '../audio/AudioEngine.js';

  export let engine: AudioEngine;
  export let isPlaying: boolean;
  export let onModeChanged: (mode: VisualizerMode) => void;

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
        visualizer.render(visualData, isPlaying);
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
    if (!visualizer) return 'bars_and_waves';
    const nextMode = visualizer.cycleMode();
    onModeChanged(nextMode);
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
    /* Soft dark-mahogany vignette framing + micro amber/charcoal scanlines */
    background: 
      radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(14, 9, 6, 0.45) 75%, rgba(7, 4, 2, 0.88) 100%),
      linear-gradient(rgba(245, 158, 11, 0.015) 50%, rgba(0, 0, 0, 0.16) 50%);
    background-size: 100% 100%, 100% 4px;
    box-shadow: inset 0 0 100px rgba(5, 3, 2, 0.75);
    z-index: 5;
    opacity: 0.85;
  }
</style>
