<script>
  import { createEventDispatcher } from 'svelte'

  export let showBack = false
  export let title = ''
  export let subtitle = ''

  const dispatch = createEventDispatcher()
</script>

<div class="frame">
  {#if showBack}
    <button class="btn-nav" type="button" on:click={() => dispatch('back')} aria-label="Назад">←</button>
  {/if}

  <div class="frame__content">
    {#if title || subtitle}
      <header class="frame__header">
        {#if title}
          <h1 class="frame__title">{title}</h1>
        {/if}
        {#if subtitle}
          <p class="frame__subtitle">{subtitle}</p>
        {/if}
      </header>
    {/if}

    <slot />
  </div>
</div>
