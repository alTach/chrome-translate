<script>
  import StatusMessage from './StatusMessage.svelte'

  export let labels
  export let draft
  export let statusText = ''
  export let statusType = 'default'
  export let showExtraActions = false
  export let sendLabel = 'Отправить'
  export let onDraftChange = () => {}
  export let onSend = () => {}
  export let onCopy = () => {}
</script>

<div class="app-stack">
  <input bind:value={draft.title} class="app-input" type="text" placeholder={labels.feedbackTitle} on:input={onDraftChange} />
  <textarea bind:value={draft.message} class="app-textarea" placeholder={labels.feedbackMessage} on:input={onDraftChange}></textarea>
  <StatusMessage text={statusText} type={statusType} />

  <div class="app-row">
    <button class="btn-secondary" type="button" on:click={onSend}>{sendLabel}</button>
    {#if showExtraActions}
      <button class="btn-secondary" type="button" on:click={onCopy}>{labels.copiedShort}</button>
    {/if}
  </div>
</div>
