<script lang="ts">
  export let seed: string;
  export let isPlaying: boolean;
  export let currentMode: string;
  export let onRollSeed: () => void;
  export let onCycleMode: () => void;
</script>

<header class="top-hud">
  <!-- Seed Name Button (Starts loop, rolls new seed) -->
  <div class="glass-pill seed-pill">
    <span class="status-dot {isPlaying ? 'active' : ''}"></span>
    <span class="seed-label font-mono">SEED:</span>
    <button 
      onclick={onRollSeed}
      class="seed-btn font-mono"
      title="Click to roll new seed and start loop"
    >
      <span>{seed}</span>
      <span class="dice-icon">🎲</span>
    </button>
  </div>

  <!-- Visualizer Mode Switcher -->
  <button 
    onclick={onCycleMode}
    class="btn-glass font-mono"
    title="Cycle visualizer mode"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
    <span>{currentMode}</span>
  </button>
</header>

<style>
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
    background: #3f2e22;
    transition: all 0.3s;
  }

  .status-dot.active {
    background: #f59e0b;
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.9), 0 0 4px #fef3c7;
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
</style>
