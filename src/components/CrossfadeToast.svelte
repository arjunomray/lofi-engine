<script lang="ts">
  export let notice: string;
</script>

{#if notice}
  <div class="crossfade-toast toast-anim font-mono">
    <span class="pulse-dot"></span>
    <span>{notice}</span>
  </div>
{/if}

<style>
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
</style>
