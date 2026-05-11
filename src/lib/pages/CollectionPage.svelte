<script>
  import CollectionList from '@/lib/components/CollectionList.svelte'

  export let labels
  export let items = []
  export let emptyText = ''
  export let favoriteIds = new Set()
  export let onOpen = () => {}
  export let onToggleFavorite = () => {}
</script>

<CollectionList
  {items}
  {emptyText}
  {favoriteIds}
  addFavoriteText={labels.addFavorite}
  removeFavoriteText={labels.removeFavorite}
  {onOpen}
  {onToggleFavorite}
/>
