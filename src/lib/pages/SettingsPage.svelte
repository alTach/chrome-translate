<script>
  import LanguageSelect from '@/lib/components/LanguageSelect.svelte'

  export let labels
  export let settings
  export let targetLanguages = []
  export let interfaceLanguages = []
  export let showFeedbackLink = false
  export let onNavigate = () => {}
  export let onSettingsChange = () => {}
</script>

<div class="stack">
  <LanguageSelect
    label={labels.targetLanguage}
    options={targetLanguages}
    bind:value={settings.targetLanguage}
    on:change={onSettingsChange}
  />
  <LanguageSelect
    label={labels.interfaceLanguage}
    options={interfaceLanguages}
    bind:value={settings.interfaceLanguage}
    on:change={onSettingsChange}
  />

  <div class="field">
    <span>{labels.shortcut}</span>
    <div class="shortcut">
      <span>Alt + Shift +</span>
      <span class="key">{(settings.shortcutKey || 's').toUpperCase()}</span>
    </div>
  </div>

  {#if showFeedbackLink}
    <div class="footer">
      <button class="link" type="button" on:click={() => onNavigate('feedback')}>{labels.feedback}</button>
    </div>
  {/if}
</div>

<style>
  .stack {
    display: grid;
    gap: 16px;
    padding: 18px;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  .field > span {
    color: var(--muted);
    font-size: 12px;
  }

  .shortcut {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
  }

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line);
    color: var(--text);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
  }

  .link {
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 0;
    font: inherit;
    cursor: pointer;
  }
</style>
