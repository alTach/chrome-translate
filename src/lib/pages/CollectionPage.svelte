<script>
  import CollectionList from '@/lib/components/CollectionList.svelte'

  export let labels
  export let items = []
  export let emptyText = ''
  export let favoriteKeys = new Set()
  export let noticeText = ''
  export let limit = null
  export let onLimitChange = null
  export let onOpen = () => {}
  export let onToggleFavorite = () => {}

  let isEditing = false
  let editValue = ''
  let inputElement = null

  function startEditing() {
    editValue = String(limit ?? 20)
    isEditing = true
    setTimeout(() => {
      inputElement?.focus()
      inputElement?.select()
    }, 0)
  }

  function cancelEditing() {
    isEditing = false
  }

  function saveLimit() {
    if (!isEditing) return
    isEditing = false
    const parsed = parseInt(editValue, 10)
    if (isNaN(parsed)) return
    const clamped = Math.min(99, Math.max(1, parsed))
    if (onLimitChange && clamped !== limit) {
      onLimitChange(clamped)
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveLimit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }
</script>

{#if limit != null && onLimitChange}
  <div class="flex justify-end px-[18px] pt-3 text-xs text-[var(--muted)]">
    {#if isEditing}
      <input
        bind:this={inputElement}
        bind:value={editValue}
        type="number"
        min="1"
        max="99"
        class="w-10 px-1 py-0.5 text-xs text-center border border-[var(--accent)] rounded-xs outline-none bg-white text-[var(--text)]"
        on:blur={saveLimit}
        on:keydown={handleKeydown}
      />
    {:else}
      <button
        type="button"
        class="inline-flex items-center justify-center px-1.5 py-0.5 text-xs text-[var(--muted)] border border-transparent border-b-current hover:border-current hover:text-[var(--text)] cursor-pointer rounded-xs transition-colors"
        on:click={startEditing}
        title="Лимит истории (макс. 99)"
      >
        {limit}
      </button>
    {/if}
  </div>
{:else if noticeText}
  <div class="flex justify-end px-[18px] pt-3 text-xs text-[var(--muted)]">
    {noticeText}
  </div>
{/if}

<CollectionList
  {items}
  {emptyText}
  {favoriteKeys}
  addFavoriteText={labels.addFavorite}
  removeFavoriteText={labels.removeFavorite}
  {onOpen}
  {onToggleFavorite}
/>
