<script>
  import LanguageSelect from '@/lib/components/LanguageSelect.svelte'

  let shortcutFocused = false

  function normalizeShortcutKey(value) {
    if (typeof value === 'string' && /^[a-z]$/i.test(value)) {
      return value.toLowerCase()
    }

    return ''
  }

  function handleShortcutKeydown(event) {
    const nextKey = normalizeShortcutKey(event.key)

    if (!nextKey) {
      return
    }

    event.preventDefault()
    settings.shortcutKey = nextKey
    onSettingsChange()
  }

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
    <div
      class="shortcut-button"
      type="button"
      on:focus={() => {
        shortcutFocused = true
      }}
      on:blur={() => {
        shortcutFocused = false
      }}
      on:keydown={handleShortcutKeydown}
    >
      <span>Alt + Shift +</span>
      <button class:shortcut-key--active={shortcutFocused} class="shortcut-key">
        {(settings.shortcutKey || 's').toUpperCase()}
      </button>
    </div>
  </div>

  {#if showFeedbackLink}
    <div class="app-footer">
      <button class="btn-link" type="button" on:click={() => onNavigate('feedback')}>{labels.feedback}</button>
    </div>
  {/if}
</div>
