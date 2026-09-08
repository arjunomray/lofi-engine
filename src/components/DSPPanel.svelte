<script lang="ts">
  import type { LoFiDSPParams } from '../audio/types.js';

  export let params: LoFiDSPParams;
  export let onParamChange: (key: keyof LoFiDSPParams, val: number) => void;
  export let onClose: () => void;
</script>

<div class="glass-panel dsp-panel panel-anim font-mono">
  <div class="dsp-header">
    <span>LO-FI SOUND DESIGN</span>
    <button onclick={onClose} class="close-btn" title="Close panel">✕</button>
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
        oninput={(e) => onParamChange('filterCutoff', Number((e.target as HTMLInputElement).value))}
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
        oninput={(e) => onParamChange('tapeWobbleDepth', Number((e.target as HTMLInputElement).value))}
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
        oninput={(e) => onParamChange('vinylVolume', Number((e.target as HTMLInputElement).value))}
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
        oninput={(e) => onParamChange('sidechainStrength', Number((e.target as HTMLInputElement).value))}
      />
    </div>
  </div>
</div>

<style>
  .dsp-panel {
    width: 100%;
    max-width: 520px;
    padding: 20px 24px;
    border-radius: 20px;
    font-size: 12px;
    pointer-events: auto;
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
    color: #00f0ff;
    font-weight: 600;
    text-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
  }
</style>
