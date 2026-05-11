<script>
  import StatusMessage from '@/lib/components/StatusMessage.svelte'

  export let labels
  export let sourceText = ''
  export let statusText = ''
  export let statusType = 'default'
  export let loading = false
  export let hasFavorites = false
  export let onTranslate = () => {}
  export let onClear = () => {}
  export let onNavigate = () => {}
</script>

<div class="stack">
  <textarea bind:value={sourceText} class="textarea" placeholder={labels.sourcePlaceholder}></textarea>

  {#if loading}
    <div class="loading">
      <div class="bar"></div>
    </div>
  {/if}

  <StatusMessage text={statusText} type={statusType} />

  <div class="actions">
    <button class="link" type="button" on:click={onClear}>{labels.clear}</button>
    <button class="primary" type="button" on:click={() => onTranslate(sourceText)}>{labels.translate}</button>
  </div>

  <div class="nav">
    <button class="link" type="button" on:click={() => onNavigate('settings')}>{labels.settings}</button>
    <button class="link" type="button" on:click={() => onNavigate('history')}>{labels.history}</button>
    <button class="link" type="button" disabled={!hasFavorites} on:click={() => onNavigate('favorites')}>
      {labels.favorites}
    </button>
  </div>
</div>

<style>
  .stack {
    display: grid;
    gap: 12px;
    padding: 18px;
  }

  .textarea {
    min-height: 132px;
    resize: vertical;
    border: 1px solid var(--line);
    padding: 12px;
    font: inherit;
    outline: none;
  }

  .textarea:focus {
    border-color: var(--accent);
  }

  .actions,
  .nav {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  .primary,
  .link {
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }

  .primary {
    background: var(--accent);
    color: #fff;
    padding: 10px 16px;
  }

  .link {
    color: var(--muted);
    padding: 0;
  }

  .link:hover:not(:disabled) {
    color: var(--text);
  }

  .link:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .loading {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: #edf1f6;
  }

  .bar {
    height: 100%;
    width: 24%;
    background: var(--accent);
    border-radius: 999px;
    animation: slide 1.25s ease-in-out infinite;
  }

  @keyframes slide {
    0% {
      transform: translateX(-110%);
    }

    50% {
      transform: translateX(90%);
    }

    100% {
      transform: translateX(220%);
    }
  }
</style>
