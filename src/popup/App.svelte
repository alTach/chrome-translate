<script>
  import LoadingBar from '../lib/components/LoadingBar.svelte';
  import HistoryList from '../lib/components/HistoryList.svelte';
  import {
    TARGET_LANGUAGES,
    getLanguageLabel
  } from '../lib/constants.js';
  import {
    isLocalTranslationSupported,
    translateText
  } from '../lib/translator.js';
  import {
    addHistoryEntry,
    getFeedbackDraft,
    getHistory,
    getLastSelection,
    getSettings,
    saveFeedbackDraft,
    saveSettings
  } from '../lib/storage.js';

  let screen = $state('input');
  let sourceText = $state('');
  let translatedText = $state('');
  let targetLanguage = $state('');
  let settingsReady = $state(false);
  let loading = $state(false);
  let loadingProgress = $state(0);
  let history = $state([]);
  let errorMessage = $state('');
  let feedbackEmail = $state('');
  let feedbackTitle = $state('');
  let feedbackMessage = $state('');
  let shortcutKey = $state('s');
  let saveStatus = $state('');

  const canTranslate = $derived(
    settingsReady && !loading && sourceText.trim().length > 0
  );

  async function boot() {
    const [settings, loadedHistory, feedbackDraft, lastSelection] = await Promise.all([
      getSettings(),
      getHistory(),
      getFeedbackDraft(),
      getLastSelection()
    ]);
    targetLanguage = settings.targetLanguage;
    shortcutKey = settings.shortcutKey || 's';
    history = loadedHistory;
    feedbackEmail = feedbackDraft.email || '';
    feedbackTitle = feedbackDraft.title;
    feedbackMessage = feedbackDraft.message;
    if (lastSelection?.trim()) {
      sourceText = lastSelection;
    }
    settingsReady = true;
  }

  async function persistSettings() {
    await saveFeedbackDraft({
      email: feedbackEmail,
      title: feedbackTitle,
      message: feedbackMessage
    });
    saveStatus = 'Сохранено';
    setTimeout(() => {
      saveStatus = '';
    }, 1200);
  }

  async function applyTargetLanguage(nextLanguage) {
    targetLanguage = nextLanguage;
    await saveSettings({ targetLanguage: nextLanguage, shortcutKey });
  }

  async function applyShortcutKey(nextKey) {
    const normalizedKey = (nextKey || 's').slice(0, 1).toLowerCase();
    shortcutKey = normalizedKey;
    await saveSettings({ targetLanguage, shortcutKey: normalizedKey });
  }

  function showHistoryItem(item) {
    sourceText = item.sourceText;
    translatedText = item.translatedText;
    targetLanguage = item.language;
    errorMessage = '';
    screen = 'result';
  }

  async function retranslateWithLanguage(nextLanguage) {
    await applyTargetLanguage(nextLanguage);
    if (screen === 'result' && sourceText.trim()) {
      await handleTranslate();
    }
  }

  async function handleTranslate() {
    errorMessage = '';

    if (!sourceText.trim()) {
      errorMessage = 'Введите текст для перевода.';
      return;
    }

    const settings = await getSettings();
    targetLanguage = settings.targetLanguage;

    if (!isLocalTranslationSupported()) {
      errorMessage = 'Нужен Chrome 138+ на компьютере. На мобильных браузерах API не работает.';
      return;
    }

    loading = true;
    loadingProgress = 0;

    try {
      const result = await translateText({
        text: sourceText,
        targetLanguage: settings.targetLanguage,
        onProgress(progress) {
          loadingProgress = progress;
        }
      });
      translatedText = result.translatedText;

      history = await addHistoryEntry({
        id: crypto.randomUUID(),
        sourceText,
        translatedText,
        language: result.targetLanguage,
        languageLabel: getLanguageLabel(result.targetLanguage),
        createdAt: Date.now()
      });

      screen = 'result';
    } catch (error) {
      errorMessage = error.message;
    } finally {
      loading = false;
      loadingProgress = 0;
    }
  }

  boot();
</script>

<svelte:head>
  <title>Local Translator</title>
</svelte:head>

<div class="w-full">
  <main class="w-[380px] max-w-full border border-[var(--line)] bg-white">
    {#if screen === 'input'}
      <section class="p-2">
        <div>
          <textarea
            bind:value={sourceText}
            class="field min-h-[116px] resize-y text-sm leading-5"
            rows="1"
            placeholder="Введите текст"
            onkeydown={(event) => {
              if (event.key === 'Enter' && canTranslate) {
                event.preventDefault();
                handleTranslate();
              }
            }}
          ></textarea>
        </div>

        <LoadingBar active={loading} progress={loadingProgress} />

        {#if errorMessage}
          <div class="mt-2 text-xs text-red-700">{errorMessage}</div>
        {/if}

        <div class="mt-1 flex items-center justify-end gap-4 text-sm">
          <button
            type="button"
            class="text-link"
            onclick={() => {
              sourceText = '';
              errorMessage = '';
            }}
          >
            Очистить
          </button>
          <button
            type="button"
            class="text-link"
            onclick={handleTranslate}
            disabled={!canTranslate}
          >
            Перевести
          </button>
        </div>

        <div class="mt-4 flex items-center gap-4 text-sm">
          <button type="button" class="text-link" onclick={() => (screen = 'settings')}>Настройки</button>
          <button type="button" class="text-link" onclick={() => (screen = 'history')}>История</button>
        </div>
      </section>
    {:else if screen === 'result'}
      <section class="flex">
        <button
          type="button"
          class="left-rail text-[var(--muted)] transition hover:text-[var(--muted-hover)]"
          onclick={() => {
            errorMessage = '';
            screen = 'input';
          }}
          aria-label="Назад"
        >
          ←
        </button>
        <div class="flex-1 p-3 text-sm leading-6">
          <div class="whitespace-pre-wrap">{sourceText}</div>
          <div class="my-3 flex items-center gap-3">
            <div class="h-px flex-1 bg-[var(--line)]"></div>
            <select
              bind:value={targetLanguage}
              class="bg-transparent text-xs text-[var(--muted)]"
              onchange={(event) => retranslateWithLanguage(event.currentTarget.value)}
            >
              {#each TARGET_LANGUAGES as language}
                <option value={language.code}>{language.label}</option>
              {/each}
            </select>
          </div>
          <div class="whitespace-pre-wrap">{translatedText}</div>
        </div>
      </section>
    {:else if screen === 'history'}
      <section class="flex">
        <button
          type="button"
          class="left-rail text-[var(--muted)] transition hover:text-[var(--muted-hover)]"
          onclick={() => (screen = 'input')}
          aria-label="Назад"
        >
          ←
        </button>
        <div class="min-w-0 flex-1">
          <div class="max-h-[240px] overflow-y-auto">
            <HistoryList {history} onSelect={showHistoryItem} />
          </div>
        </div>
      </section>
    {:else}
      <section class="flex">
        <button
          type="button"
          class="left-rail text-[var(--muted)] transition hover:text-[var(--muted-hover)]"
          onclick={() => (screen = 'input')}
          aria-label="Назад"
        >
          ←
        </button>
        <div class="min-w-0 flex-1 py-2 pr-2">
          <div class="grid gap-3">
            <div>
              <div class="mb-2 text-xs text-[var(--muted)]">Язык перевода</div>
              <select
                bind:value={targetLanguage}
                class="field text-sm"
                onchange={(event) => applyTargetLanguage(event.currentTarget.value)}
              >
                {#each TARGET_LANGUAGES as language}
                  <option value={language.code}>{language.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <div class="mb-2 text-xs text-[var(--muted)]">Горячая клавиша</div>
              <input
                bind:value={shortcutKey}
                class="field text-sm"
                type="text"
                maxlength="1"
                placeholder="S"
                oninput={(event) => applyShortcutKey(event.currentTarget.value)}
              />
            </div>

            <div>
              <div class="mb-2 text-xs text-[var(--muted)]">Обратная связь</div>
              <div class="grid gap-2">
                <input
                  bind:value={feedbackEmail}
                  class="field text-sm"
                  type="email"
                  placeholder="Почта"
                />

                <input
                  bind:value={feedbackTitle}
                  class="field text-sm"
                  type="text"
                  placeholder="Заголовок"
                />

                <textarea
                  bind:value={feedbackMessage}
                  class="field min-h-[120px] resize-y text-sm"
                  placeholder="Сообщение"
                ></textarea>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <button
                type="button"
                class="primary-btn px-4 py-2 text-sm"
                onclick={persistSettings}
              >
                Отправить
              </button>

              {#if saveStatus}
                <div class="text-xs text-[var(--success)]">{saveStatus}</div>
              {/if}
            </div>
          </div>
        </div>
      </section>
    {/if}
  </main>
</div>
