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
    padding: 10px 22px;
    background: rgba(18, 8, 35, 0.88);
    border: 1px solid rgba(0, 240, 255, 0.35);
    color: #e0f2fe;
    border-radius: 9999px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(20px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 240, 255, 0.2);
    pointer-events: none;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00f0ff;
    box-shadow: 0 0 10px #00f0ff, 0 0 3px #fff;
  }
</style>
