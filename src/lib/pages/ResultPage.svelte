<script>
  import LanguageSelect from '@/lib/components/LanguageSelect.svelte'
  import StatusMessage from '@/lib/components/StatusMessage.svelte'

  export let labels
  export let session
  export let targetLanguages = []
  export let isFavorite = false
  export let loading = false
  export let loadingText = ''
  export let onChangeLanguage = () => {}
  export let onToggleFavorite = () => {}
</script>

<div class="app-stack-lg">
  <div class="content-copy">{session.sourceText || labels.noData}</div>

  <div class="result-toolbar">
    <div class="result-divider">
      {#if loading}
        <div class="loading-bar"></div>
      {/if}
    </div>
    <LanguageSelect
      options={targetLanguages}
      value={session.targetLanguage}
      muted={true}
      on:change={(event) => onChangeLanguage(event.detail)}
    />
    <button
      class="btn-icon"
      type="button"
      aria-label={isFavorite ? labels.removeFavorite : labels.addFavorite}
      on:click={() => onToggleFavorite()}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  </div>

  <StatusMessage text={loadingText} />

  <div class="content-copy">{session.translatedText}</div>
</div>
