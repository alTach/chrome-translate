<script>
  export let title = ''
  export let compact = false
</script>

<svelte:head>
  <title>{title || 'Local Translator'}</title>
</svelte:head>

<main class:app-shell={!compact} class:app-shell--compact={compact}>
  <section class="app-card">
    <slot />
  </section>
</main>
