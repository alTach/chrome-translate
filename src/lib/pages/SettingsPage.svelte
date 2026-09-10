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

<div class="app-stack-lg">
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

  <div class="app-field">
    <span class="app-label">{labels.translationEngine}</span>
    <div class="app-radio-group">
      <label class="app-radio">
        <input
          type="radio"
          name="engine"
          value="native"
          bind:group={settings.translationEngine}
          on:change={onSettingsChange}
        />
        <span>{labels.engineNative}</span>
      </label>
      <label class="app-radio">
        <input
          type="radio"
          name="engine"
          value="google"
          bind:group={settings.translationEngine}
          on:change={onSettingsChange}
        />
        <span>{labels.engineGoogle}</span>
      </label>
    </div>
  </div>

  <div class="app-field">
    <span class="app-label">{labels.shortcut}</span>
    <div class="shortcut-button">
      <span>Alt + Shift +</span>
      <span class="shortcut-key">S</span>
    </div>
    <span class="shortcut-hint">{labels.shortcutHint}</span>
  </div>

  {#if showFeedbackLink}
    <div class="app-footer">
      <button class="btn-link" type="button" on:click={() => onNavigate('feedback')}>{labels.feedback}</button>
    </div>
  {/if}
</div>
