<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    seed: string;
    isPlaying: boolean;
    currentMode: string;
    recentSeeds?: string[];
    onRollSeed: () => void;
    onSetSeed: (newSeed: string) => void;
    onCycleMode: () => void;
  }

  let {
    seed,
    isPlaying,
    currentMode,
    recentSeeds = [],
    onRollSeed,
    onSetSeed,
    onCycleMode
  }: Props = $props();

  let isDropdownOpen = $state(false);
  let typedSeed = $state('');
  let inputElement = $state<HTMLInputElement | null>(null);
  let containerElement = $state<HTMLDivElement | null>(null);

  function toggleDropdown(e: MouseEvent) {
    e.stopPropagation();
    isDropdownOpen = !isDropdownOpen;
    if (isDropdownOpen) {
      typedSeed = seed;
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
        }
      }, 50);
    }
  }

  function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    const clean = typedSeed.trim();
    if (clean) {
      onSetSeed(clean);
      isDropdownOpen = false;
    }
  }

  function handleSelectRecent(s: string) {
    onSetSeed(s);
    isDropdownOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (isDropdownOpen && containerElement && !containerElement.contains(event.target as Node)) {
      isDropdownOpen = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isDropdownOpen) {
      isDropdownOpen = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

<header class="top-hud">
  <!-- Seed Pill + Editor Dropdown Container -->
  <div class="seed-container" bind:this={containerElement}>
    <div class="glass-pill seed-pill">
      <span class="status-dot {isPlaying ? 'active' : ''}"></span>
      <span class="seed-label font-mono">SEED:</span>

      <!-- Seed Name Button (Rolls new seed) -->
      <button 
        onclick={onRollSeed}
        class="seed-btn font-mono"
        title="Click to roll new seed and start loop"
      >
        <span>{seed}</span>
        <span class="dice-icon">🎲</span>
      </button>

      <div class="pill-divider"></div>

      <!-- Pencil Icon Button (Opens typing input & recent 5 seeds) -->
      <button 
        onclick={toggleDropdown}
        class="pencil-btn {isDropdownOpen ? 'active' : ''}"
        title="Edit seed or choose from recent seeds"
        aria-label="Edit seed"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      </button>
    </div>

    <!-- Dropdown / Popover -->
    {#if isDropdownOpen}
      <div class="seed-dropdown glass-panel panel-anim">
        <!-- Input Form to type custom seed -->
        <form onsubmit={handleFormSubmit} class="seed-input-form">
          <div class="input-wrapper">
            <svg class="input-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <input 
              type="text"
              bind:this={inputElement}
              bind:value={typedSeed}
              placeholder="Type seed name..."
              class="seed-text-input font-mono"
              maxlength="45"
            />
          </div>
          <button type="submit" class="seed-submit-btn font-mono" disabled={!typedSeed.trim()}>
            Apply
          </button>
        </form>

        <!-- History List (Last 5 seeds) -->
        {#if recentSeeds && recentSeeds.length > 0}
          <div class="recent-section">
            <div class="recent-header font-mono">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>LAST {recentSeeds.length} SEEDS</span>
            </div>

            <div class="recent-list">
              {#each recentSeeds as s}
                <button 
                  type="button"
                  class="recent-item font-mono {s === seed ? 'active' : ''}"
                  onclick={() => handleSelectRecent(s)}
                  title="Load {s}"
                >
                  <div class="recent-left">
                    <span class="recent-dot">•</span>
                    <span class="recent-name">{s}</span>
                  </div>
                  {#if s === seed}
                    <span class="active-badge">ACTIVE</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Visualizer Mode Switcher -->
  <button 
    onclick={onCycleMode}
    class="btn-glass font-mono"
    title="Cycle visualizer mode"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2">
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

  .seed-container {
    position: relative;
    display: inline-block;
  }

  .seed-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 6px 16px;
    border-radius: 9999px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #281540;
    transition: all 0.3s;
  }

  .status-dot.active {
    background: #00f0ff;
    box-shadow: 0 0 12px #00f0ff, 0 0 4px #fff;
  }

  .seed-label {
    font-size: 11px;
    color: #9d8db5;
    letter-spacing: 0.06em;
  }

  .seed-btn {
    background: transparent;
    border: none;
    color: #00f0ff;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
    transition: color 0.2s;
  }

  .seed-btn:hover {
    color: #38bdf8;
    text-shadow: 0 0 14px rgba(0, 240, 255, 0.8);
  }

  .dice-icon {
    font-size: 12px;
    opacity: 0.9;
  }

  .pill-divider {
    width: 1px;
    height: 14px;
    background: rgba(0, 240, 255, 0.25);
    margin: 0 2px;
  }

  .pencil-btn {
    background: transparent;
    border: none;
    color: #9d8db5;
    padding: 5px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pencil-btn:hover {
    color: #00f0ff;
    background: rgba(0, 240, 255, 0.15);
  }

  .pencil-btn.active {
    color: #ff007f;
    background: rgba(255, 0, 127, 0.25);
  }

  /* Seed Editor Dropdown Popover */
  .seed-dropdown {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 320px;
    padding: 14px;
    border-radius: 16px;
    background: rgba(16, 8, 28, 0.95);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(0, 240, 255, 0.25);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.15);
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 50;
  }

  .seed-input-form {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .input-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 10px;
    color: #00f0ff;
    pointer-events: none;
  }

  .seed-text-input {
    width: 100%;
    padding: 8px 12px 8px 30px;
    background: rgba(8, 4, 16, 0.9);
    border: 1px solid rgba(0, 240, 255, 0.25);
    border-radius: 8px;
    color: #ffffff;
    font-size: 12px;
    outline: none;
    transition: all 0.2s ease;
  }

  .seed-text-input:focus {
    border-color: #00f0ff;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.35);
  }

  .seed-submit-btn {
    background: linear-gradient(135deg, #ff007f, #8b5cf6);
    border: none;
    color: #ffffff;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(255, 0, 127, 0.4);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .seed-submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff1a8c, #a855f7);
    box-shadow: 0 0 16px rgba(255, 0, 127, 0.6);
  }

  .seed-submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Recent Seeds Section */
  .recent-section {
    border-top: 1px solid rgba(0, 240, 255, 0.15);
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .recent-header {
    font-size: 10px;
    color: #9d8db5;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 4px;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .recent-item {
    background: transparent;
    border: none;
    color: #d1c7e6;
    padding: 6px 8px;
    border-radius: 6px;
    text-align: left;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.15s ease;
  }

  .recent-item:hover {
    background: rgba(0, 240, 255, 0.12);
    color: #ffffff;
  }

  .recent-item.active {
    color: #00f0ff;
    font-weight: 600;
    background: rgba(0, 240, 255, 0.1);
  }

  .recent-left {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-dot {
    color: #ff007f;
    font-size: 14px;
    line-height: 1;
  }

  .recent-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .active-badge {
    font-size: 9px;
    background: rgba(0, 240, 255, 0.2);
    color: #38bdf8;
    border: 1px solid rgba(0, 240, 255, 0.4);
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.06em;
  }
</style>
