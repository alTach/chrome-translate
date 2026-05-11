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
  export let onSave = () => {}
  export let onCopy = () => {}
  export let onMail = () => {}
</script>

<div class="stack">
  <div class="section">
    <LanguageSelect label={labels.defaultTargetLanguage} options={targetLanguages} bind:value={settings.targetLanguage} />
  </div>

  <div class="section">
    <LanguageSelect label={labels.interfaceLanguage} options={interfaceLanguages} bind:value={settings.interfaceLanguage} />
  </div>

  <div class="section">
    <StatusMessage text={statusText} type={statusType} />
    <FeedbackForm
      labels={labels}
      draft={feedbackDraft}
      showExtraActions={true}
      onSave={onSave}
      onCopy={onCopy}
      onMail={onMail}
    />
  </div>
</div>

<style>
  .stack {
    display: grid;
  }

  .section {
    border-top: 1px solid var(--line);
  }

  .section:first-child {
    border-top: 0;
  }
</style>
