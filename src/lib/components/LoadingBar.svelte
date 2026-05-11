<script>
  let { active = false, progress = 0 } = $props();
</script>

{#if active}
  <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
    {#if progress > 0}
      <div
        class="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
        style={`width:${Math.max(8, Math.min(progress * 100, 100))}%`}
      ></div>
    {:else}
      <div class="loading-slider h-full rounded-full bg-[var(--accent)]"></div>
    {/if}
  </div>
{/if}
