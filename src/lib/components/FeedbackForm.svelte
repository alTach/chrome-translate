<script>
  import StatusMessage from './StatusMessage.svelte'

  export let labels
  export let draft
  export let statusText = ''
  export let statusType = 'default'
  export let showExtraActions = false
  export let onSave = () => {}
  export let onCopy = () => {}
  export let onMail = () => {}
</script>

<div class="stack">
  <input bind:value={draft.email} class="input" type="email" placeholder={labels.feedbackEmail} />
  <input bind:value={draft.title} class="input" type="text" placeholder={labels.feedbackTitle} />
  <textarea bind:value={draft.message} class="input textarea" placeholder={labels.feedbackMessage}></textarea>
  <StatusMessage text={statusText} type={statusType} />

  <div class="row">
    <button class="primary" type="button" on:click={onSave}>{labels.save}</button>
    {#if showExtraActions}
      <button class="secondary" type="button" on:click={onCopy}>{labels.copiedShort}</button>
      <button class="secondary" type="button" on:click={onMail}>{labels.mail}</button>
    {/if}
  </div>
</div>

<style>
  .stack {
    display: grid;
    gap: 12px;
    padding: 18px;
  }

  .row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .input {
    width: 100%;
    border: 1px solid var(--line);
    background: #fff;
    color: var(--text);
    padding: 10px 12px;
    font: inherit;
    outline: none;
  }

  .input:focus {
    border-color: var(--accent);
  }

  .textarea {
    min-height: 120px;
    resize: vertical;
  }

  .primary,
  .secondary {
    border: 0;
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
  }

  .primary {
    background: var(--accent);
    color: #fff;
  }

  .secondary {
    background: #fff;
    border: 1px solid var(--line);
  }
</style>
