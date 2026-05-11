<script>
  export let title = ''
  export let compact = false
</script>

<svelte:head>
  <title>{title || 'Local Translator'}</title>
</svelte:head>

<main class:page-shell={!compact} class:popup-shell={compact}>
  <section class="card">
    <slot />
  </section>
</main>

<style>
  .popup-shell {
    width: 100%;
  }

  .page-shell {
    margin: 0 auto;
    max-width: 760px;
    padding: 24px 16px;
  }

  .card {
    border: 1px solid var(--line);
    background: var(--panel);
    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
  }
</style>
