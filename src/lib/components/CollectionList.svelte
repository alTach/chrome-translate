<script>
  function getEntryKey(entry) {
    return JSON.stringify([
      entry?.sourceText?.trim() || '',
      entry?.translatedText?.trim() || '',
      entry?.language || ''
    ])
  }

  export let items = []
  export let emptyText = ''
  export let favoriteKeys = new Set()
  export let addFavoriteText = 'Добавить в избранное'
  export let removeFavoriteText = 'Убрать из избранного'
  export let onOpen = () => {}
  export let onToggleFavorite = () => {}
</script>

{#if !items.length}
  <div class="empty-state">{emptyText}</div>
{:else}
  <div class="collection-list">
    {#each items as item}
      <div class="collection-item">
        <button class="collection-open" type="button" on:click={() => onOpen(item)}>
          <div class="collection-text">{item.sourceText || 'Без текста'}</div>
        </button>
        <button
          class="btn-icon collection-favorite"
          type="button"
          aria-label={favoriteKeys.has(getEntryKey(item)) ? removeFavoriteText : addFavoriteText}
          on:click={() => onToggleFavorite(item)}
        >
          {favoriteKeys.has(getEntryKey(item)) ? '★' : '☆'}
        </button>
      </div>
    {/each}
  </div>
{/if}
