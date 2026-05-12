<script>
  import LanguageSelect from '@/lib/components/LanguageSelect.svelte'
  import FeedbackForm from '@/lib/components/FeedbackForm.svelte'
  import StatusMessage from '@/lib/components/StatusMessage.svelte'

  export let labels
  export let settings
  export let feedbackDraft
  export let targetLanguages = []
  export let interfaceLanguages = []
  export let statusText = ''
  export let statusType = 'default'
  export let sendLabel = 'Отправить'
  export let onSettingsChange = () => {}
  export let onDraftChange = () => {}
  export let onSend = () => {}
  export let onCopy = () => {}
</script>

<div>
  <div class="app-section">
    <LanguageSelect
      label={labels.defaultTargetLanguage}
      options={targetLanguages}
      bind:value={settings.targetLanguage}
      on:change={onSettingsChange}
    />
  </div>

  <div class="app-section">
    <LanguageSelect
      label={labels.interfaceLanguage}
      options={interfaceLanguages}
      bind:value={settings.interfaceLanguage}
      on:change={onSettingsChange}
    />
  </div>

  <div class="app-section">
    <StatusMessage text={statusText} type={statusType} />
    <FeedbackForm
      labels={labels}
      draft={feedbackDraft}
      {sendLabel}
      showExtraActions={true}
      onDraftChange={onDraftChange}
      onSend={onSend}
      onCopy={onCopy}
    />
  </div>
</div>
