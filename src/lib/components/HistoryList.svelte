<script>
  let { history = [], onSelect = null } = $props();
</script>

<div>
  {#if history.length === 0}
    <div class="p-3 text-sm text-[var(--muted)]">
      История пуста
    </div>
  {:else}
    {#each history as item (item.id)}
      <button
        type="button"
        class="w-full border-b border-[var(--line)] px-3 py-2 text-left transition hover:bg-[#f7f7f7]"
        onclick={() => onSelect?.(item)}
      >
        <p class="line-clamp-2 text-sm text-[var(--text)]">{item.sourceText}</p>
      </button>
    {/each}
  {/if}
</div>
