<script>
  import StatusMessage from '@/lib/components/StatusMessage.svelte'

  $: canTranslate = Boolean(sourceText.trim())

  function handleTextareaKeydown(event) {
    if (canTranslate && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      onTranslate(sourceText)
    }
  }

  export let labels
  export let sourceText = ''
  export let statusText = ''
  export let statusType = 'default'
  export let hasFavorites = false
  export let onTranslate = () => {}
  export let onClear = () => {}
  export let onNavigate = () => {}
</script>

<div class="app-stack">
  <textarea
    bind:value={sourceText}
    class="app-textarea app-textarea--translate"
    placeholder={labels.sourcePlaceholder}
    on:keydown={handleTextareaKeydown}
  ></textarea>

  <div class="app-actions-end-tight">
    <button class="btn-link" type="button" on:click={onClear}>{labels.clear}</button>
    <button class="btn-link" type="button" disabled={!canTranslate} on:click={() => onTranslate(sourceText)}>
      {labels.translate}
    </button>
  </div>

  <StatusMessage text={statusText} type={statusType} />

  <div class="app-actions-start">
    <button class="btn-link" type="button" on:click={() => onNavigate('settings')}>{labels.settings}</button>
    <button class="btn-link" type="button" on:click={() => onNavigate('history')}>{labels.history}</button>
    <button class="btn-link" type="button" disabled={!hasFavorites} on:click={() => onNavigate('favorites')}>
      {labels.favorites}
    </button>
  </div>
</div>
