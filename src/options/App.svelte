<script>
  import {
    DEFAULT_SETTINGS,
    FEEDBACK_EMAIL,
    TARGET_LANGUAGES
  } from '../lib/constants.js';
  import {
    getFeedbackDraft,
    getSettings,
    saveFeedbackDraft,
    saveSettings
  } from '../lib/storage.js';

  let targetLanguage = $state(DEFAULT_SETTINGS.targetLanguage);
  let feedbackTitle = $state('');
  let feedbackMessage = $state('');
  let saveStatus = $state('');
  let feedbackStatus = $state('');
  let feedbackReady = $state(false);

  async function boot() {
    const [settings, feedbackDraft] = await Promise.all([getSettings(), getFeedbackDraft()]);
    targetLanguage = settings.targetLanguage;
    feedbackTitle = feedbackDraft.title;
    feedbackMessage = feedbackDraft.message;
    feedbackReady = true;
  }

  async function persistSettings() {
    await saveSettings({ targetLanguage });
    saveStatus = 'Сохранено.';
    setTimeout(() => {
      saveStatus = '';
    }, 1800);
  }

  async function persistFeedback() {
    await saveFeedbackDraft({
      title: feedbackTitle,
      message: feedbackMessage
    });
  }

  async function copyFeedback() {
    const payload =
      `Тема: ${feedbackTitle || 'Без темы'}\n` +
      `Email: ${FEEDBACK_EMAIL}\n\n` +
      `${feedbackMessage || 'Сообщение пока пустое.'}`;

    await navigator.clipboard.writeText(payload);
    feedbackStatus = 'Текст обратной связи скопирован.';
    setTimeout(() => {
      feedbackStatus = '';
    }, 1800);
  }

  function openMail() {
    const subject = encodeURIComponent(feedbackTitle || 'DeepSeek Translator feedback');
    const body = encodeURIComponent(feedbackMessage || '');
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  }

  $effect(() => {
    if (feedbackReady) {
      persistFeedback();
    }
  });

  boot();
</script>

<svelte:head>
  <title>Local Translator Settings</title>
</svelte:head>

<div class="page-shell">
  <main class="mx-auto max-w-2xl border border-[var(--line)] bg-white p-3">
    <div class="grid gap-3">
      <select bind:value={targetLanguage} class="field">
        {#each TARGET_LANGUAGES as language}
          <option value={language.code}>{language.label}</option>
        {/each}
      </select>

      <input bind:value={feedbackTitle} class="field" type="text" placeholder="Заголовок" />

      <textarea
        bind:value={feedbackMessage}
        class="field min-h-[160px] resize-y"
        placeholder="Сообщение"
      ></textarea>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="primary-btn px-4 py-2 text-sm" onclick={persistSettings}>
          Сохранить
        </button>
        <button type="button" class="secondary-btn px-4 py-2 text-sm" onclick={copyFeedback}>
          Скопировать
        </button>
        <button type="button" class="secondary-btn px-4 py-2 text-sm" onclick={openMail}>
          Почта
        </button>
      </div>

      {#if saveStatus}
        <div class="text-sm text-[var(--success)]">{saveStatus}</div>
      {/if}

      {#if feedbackStatus}
        <div class="text-sm text-[var(--success)]">{feedbackStatus}</div>
      {/if}
    </div>
  </main>
</div>
