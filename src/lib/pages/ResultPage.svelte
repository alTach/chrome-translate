<script>
  import LanguageSelect from '@/lib/components/LanguageSelect.svelte'

  export let labels
  export let session
  export let targetLanguages = []
  export let isFavorite = false
  export let onChangeLanguage = () => {}
  export let onToggleFavorite = () => {}
</script>

<div class="stack">
  <div class="copy">{session.sourceText || labels.noData}</div>

  <div class="middle">
    <div class="divider"></div>
    <LanguageSelect
      options={targetLanguages}
      value={session.targetLanguage}
      muted={true}
      on:change={(event) => onChangeLanguage(event.detail)}
    />
    <button
      class="favorite"
      type="button"
      aria-label={isFavorite ? labels.removeFavorite : labels.addFavorite}
      on:click={onToggleFavorite}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  </div>

  <div class="copy">{session.translatedText}</div>
</div>

<style>
  .stack {
    display: grid;
    gap: 16px;
    padding: 18px;
  }

  .copy {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
  }

  .middle {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .divider {
    height: 1px;
    flex: 1;
    background: var(--line);
  }

  .favorite {
    border: 0;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 16px;
  }

  .favorite:hover {
    color: var(--text);
  }
</style>
