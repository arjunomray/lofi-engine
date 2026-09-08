<script lang="ts">
  export let isPlaying: boolean;
  export let showSettings: boolean;
  export let onTogglePlay: () => void;
  export let onToggleSettings: () => void;
  export let onNextBeat: () => void;
</script>

<div class="glass-pill control-pill">
  <!-- DSP Knobs Toggle Button -->
  <button 
    onclick={onToggleSettings}
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
    onclick={onTogglePlay}
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
    onclick={onNextBeat}
    class="btn-icon"
    title="Next Beat (Roll Seed)"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="5 4 15 12 5 20"></polyline>
      <line x1="19" y1="5" x2="19" y2="19"></line>
    </svg>
  </button>
</div>

<style>
  .control-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 14px;
    border-radius: 9999px;
  }
</style>
