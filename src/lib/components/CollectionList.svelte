<script>
  export let items = []
  export let emptyText = ''
  export let favoriteIds = new Set()
  export let addFavoriteText = 'Добавить в избранное'
  export let removeFavoriteText = 'Убрать из избранного'
  export let onOpen = () => {}
  export let onToggleFavorite = () => {}
</script>

{#if !items.length}
  <div class="empty">{emptyText}</div>
{:else}
  <div class="list">
    {#each items as item}
      <div class="item">
        <button class="open" type="button" on:click={() => onOpen(item)}>
          <div class="text">{item.sourceText || 'Без текста'}</div>
        </button>
        <button
          class="favorite"
          type="button"
          aria-label={favoriteIds.has(item.id) ? removeFavoriteText : addFavoriteText}
          on:click={() => onToggleFavorite(item)}
        >
          {favoriteIds.has(item.id) ? '★' : '☆'}
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .list {
    max-height: 260px;
    overflow: auto;
  }

  .item {
    display: flex;
    align-items: stretch;
    border-top: 1px solid var(--line);
  }

  .item:first-child {
    border-top: 0;
  }

  .open {
    min-width: 0;
    flex: 1;
    border: 0;
    background: transparent;
    padding: 14px 18px;
    text-align: left;
    cursor: pointer;
  }

  .open:hover {
    background: #f7f9fc;
  }

  .text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: normal;
    word-break: break-word;
  }

  .favorite {
    border: 0;
    background: transparent;
    padding: 14px 16px;
    color: var(--muted);
    cursor: pointer;
  }

  .favorite:hover {
    color: var(--text);
  }

  .empty {
    padding: 18px;
    color: var(--muted);
  }
</style>
