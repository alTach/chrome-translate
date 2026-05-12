<script>
  import CollectionList from '@/lib/components/CollectionList.svelte'

  export let labels
  export let items = []
  export let emptyText = ''
  export let favoriteKeys = new Set()
  export let noticeText = ''
  export let onOpen = () => {}
  export let onToggleFavorite = () => {}
</script>

{#if noticeText}
  <div class="collection-notice">{noticeText}</div>
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

<style>
  .collection-notice {
    padding: 12px 18px 0;
    text-align: right;
    color: var(--muted);
    font-size: 12px;
  }
</style>
