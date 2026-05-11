<script>
  import { createEventDispatcher } from 'svelte'

  export let showBack = false
  export let title = ''
  export let subtitle = ''

  const dispatch = createEventDispatcher()
</script>

<div class="frame">
  {#if showBack}
    <button class="back" type="button" on:click={() => dispatch('back')} aria-label="Назад">←</button>
  {/if}

  <div class="content">
    {#if title || subtitle}
      <header class="header">
        {#if title}
          <h1>{title}</h1>
        {/if}
        {#if subtitle}
          <p>{subtitle}</p>
        {/if}
      </header>
    {/if}

    <slot />
  </div>
</div>

<style>
  .frame {
    display: flex;
    min-height: 100%;
  }

  .back {
    width: 34px;
    min-width: 34px;
    border: 0;
    border-right: 1px solid var(--line);
    background: var(--surface-muted);
    color: var(--muted);
    cursor: pointer;
    transition: color 160ms ease, background 160ms ease;
  }

  .back:hover {
    color: var(--text);
    background: #eef2f7;
  }

  .content {
    min-width: 0;
    flex: 1;
  }

  .header {
    padding: 18px 18px 0;
  }

  h1 {
    margin: 0;
    font-size: 18px;
    line-height: 1.2;
  }

  p {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 13px;
  }
</style>
