<script lang="ts">
  interface Props {
    show: boolean;
    onClose: () => void;
  }

  let { show, onClose }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

</script>

{#if show}
  <div 
    class="modal-backdrop" 
    onclick={handleBackdropClick}
    role="presentation"
  >
    <!-- Modal Card -->
    <div class="glass-panel modal-card panel-anim font-mono">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span class="modal-title">ALGORITHMIC AUDIO ENGINE</span>
        </div>
        <button onclick={onClose} class="close-btn" title="Close">✕</button>
      </div>

      <!-- Content Scrollable Body -->
      <div class="modal-body">
        <div class="section-title">
          <span>REAL-TIME IN-BROWSER SYNTHESIS</span>
        </div>
        <div class="info-card">
          <div class="info-badge">
            <span class="pulse-dot"></span>
            <span>100% IN-BROWSER SYNTHESIS • $0 SERVER COMPUTE</span>
          </div>
          <p class="info-text">
            Every track you hear is <strong>algorithmically generated in real-time</strong> directly inside your browser via the Web Audio API:
          </p>
          <ul class="info-list">
            <li><strong>J Dilla Unquantized Swing:</strong> Humanized micro-timing with authentic 20–25ms lazy snare drag.</li>
            <li><strong>Procedural FM Rhodes & Sub-Bass:</strong> Algorithmic jazz chord comping and walking basslines.</li>
            <li><strong>Analog DSP Chain:</strong> Emulated tape wow & flutter, warm lowpass warmth, procedural vinyl crackle, and kick ducking.</li>
            <li><strong>Infinite Radio Loop:</strong> Seamless DJ crossfading between randomly evolving seeds every 1–2 loop cycles.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 1, 10, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .modal-card {
    width: 100%;
    max-width: 540px;
    max-height: 85vh;
    border-radius: 20px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: rgba(14, 6, 26, 0.95);
    border: 1px solid rgba(0, 240, 255, 0.3);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.2);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(0, 240, 255, 0.18);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .modal-title {
    font-size: 13px;
    font-weight: 700;
    color: #00f0ff;
    letter-spacing: 0.08em;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #9d8db5;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    color: #ff007f;
    background: rgba(255, 0, 127, 0.15);
  }

  .modal-body {
    overflow-y: auto;
    padding-right: 4px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Custom scrollbar */
  .modal-body::-webkit-scrollbar {
    width: 4px;
  }
  .modal-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .modal-body::-webkit-scrollbar-thumb {
    background: rgba(0, 240, 255, 0.3);
    border-radius: 4px;
  }

  .section-title {
    font-size: 10px;
    color: #9d8db5;
    letter-spacing: 0.1em;
    font-weight: 600;
  }



  .info-card {
    padding: 14px;
    background: rgba(255, 0, 127, 0.04);
    border: 1px solid rgba(255, 0, 127, 0.2);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 700;
    color: #ff007f;
    letter-spacing: 0.06em;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff007f;
    box-shadow: 0 0 8px #ff007f;
  }

  .info-text {
    font-size: 12px;
    color: #d1c7e6;
    line-height: 1.5;
  }

  .info-list {
    margin-left: 16px;
    font-size: 11px;
    color: #b3a4cb;
    display: flex;
    flex-direction: column;
    gap: 6px;
    line-height: 1.4;
  }

  .info-list strong {
    color: #00f0ff;
  }
</style>
