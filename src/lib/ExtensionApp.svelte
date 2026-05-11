<script>
  import { onMount } from 'svelte'
  import AppShell from '@/lib/components/AppShell.svelte'
  import PageFrame from '@/lib/components/PageFrame.svelte'
  import FeedbackForm from '@/lib/components/FeedbackForm.svelte'
  import CollectionPage from '@/lib/pages/CollectionPage.svelte'
  import OptionsPage from '@/lib/pages/OptionsPage.svelte'
  import ResultPage from '@/lib/pages/ResultPage.svelte'
  import SettingsPage from '@/lib/pages/SettingsPage.svelte'
  import TranslatePage from '@/lib/pages/TranslatePage.svelte'
  import { buildMessages } from '@/lib/utils/messages.js'
  import { FEEDBACK_EMAIL, INTERFACE_LANGUAGES, TARGET_LANGUAGES } from '@/shared/constants.js'
  import { isLocalTranslationSupported, translateText } from '@/shared/translator.js'
  import {
    addHistoryEntry,
    consumePopupPrefillSelection,
    getFavorites,
    getFeedbackDraft,
    getHistory,
    getLastSelection,
    getPopupSession,
    getSettings,
    saveFeedbackDraft,
    savePopupSession,
    saveSettings,
    toggleFavorite
  } from '@/shared/storage.js'

  export let context = 'popup'

  let route = context === 'options' ? 'options' : 'translate'
  let labels = {}
  let ready = false
  let loading = false
  let statusText = ''
  let statusType = 'default'
  let feedbackStatusText = ''
  let feedbackStatusType = 'default'
  let settings = { targetLanguage: 'en', interfaceLanguage: 'ru', shortcutKey: 's' }
  let sourceText = ''
  let session = { sourceText: '', translatedText: '', targetLanguage: '', entryId: '' }
  let history = []
  let favorites = []
  let feedbackDraft = { email: '', title: '', message: '' }

  $: favoriteIds = new Set(favorites.map((item) => item.id))
  $: currentEntry =
    history.find((item) => item.id === session.entryId) ||
    history.find(
      (item) =>
        item.sourceText === session.sourceText && item.translatedText === session.translatedText
    ) ||
    null

  async function loadLabels() {
    labels = await buildMessages(settings.interfaceLanguage)
  }

  async function refreshCollections() {
    ;[history, favorites, session] = await Promise.all([
      getHistory(),
      getFavorites(),
      getPopupSession()
    ])
  }

  function resetStatus() {
    statusText = ''
    statusType = 'default'
  }

  function showStatus(message, type = 'default') {
    statusText = message
    statusType = type
  }

  function showFeedbackStatus(message, type = 'default') {
    feedbackStatusText = message
    feedbackStatusType = type
    window.setTimeout(() => {
      if (feedbackStatusText === message) {
        feedbackStatusText = ''
        feedbackStatusType = 'default'
      }
    }, 1800)
  }

  function navigate(nextRoute) {
    route = nextRoute
    resetStatus()
  }

  async function createEntry(translatedText, targetLanguage) {
    const entry = {
      id: crypto.randomUUID(),
      sourceText,
      translatedText,
      language: targetLanguage,
      createdAt: Date.now()
    }

    await addHistoryEntry(entry)
    await savePopupSession({
      sourceText: entry.sourceText,
      translatedText: entry.translatedText,
      targetLanguage: entry.language,
      entryId: entry.id
    })
    await refreshCollections()
    route = 'result'
  }

  async function handleTranslate(text) {
    resetStatus()
    sourceText = text

    if (!sourceText.trim()) {
      showStatus(labels.emptyInput, 'error')
      return
    }

    if (!isLocalTranslationSupported()) {
      showStatus(labels.noTranslator, 'error')
      return
    }

    loading = true

    try {
      const result = await translateText({
        text: sourceText,
        targetLanguage: settings.targetLanguage
      })

      await createEntry(result.translatedText, result.targetLanguage)
    } catch (error) {
      showStatus(error.message || labels.translationFailed, 'error')
    } finally {
      loading = false
    }
  }

  async function openEntry(item) {
    await savePopupSession({
      sourceText: item.sourceText,
      translatedText: item.translatedText,
      targetLanguage: item.language,
      entryId: item.id
    })
    await refreshCollections()
    route = 'result'
  }

  async function toggleFavoriteEntry(item = currentEntry) {
    if (!item) {
      return
    }

    await toggleFavorite(item)
    favorites = await getFavorites()
  }

  async function updateResultLanguage(nextLanguage) {
    if (!session.sourceText) {
      return
    }

    loading = true
    resetStatus()

    try {
      sourceText = session.sourceText
      const result = await translateText({
        text: session.sourceText,
        targetLanguage: nextLanguage
      })
      await createEntry(result.translatedText, result.targetLanguage)
    } catch (error) {
      showStatus(error.message || labels.translationFailed, 'error')
    } finally {
      loading = false
    }
  }

  async function persistSettings() {
    settings = await saveSettings(settings)
    await loadLabels()
    showFeedbackStatus(labels.saveSuccess, 'success')
  }

  async function persistPopupSettings() {
    settings = await saveSettings(settings)
    await loadLabels()
  }

  async function saveFeedback() {
    await saveFeedbackDraft(feedbackDraft)
    showFeedbackStatus(labels.saveShort, 'success')
  }

  async function copyFeedback() {
    const payload =
      `Тема: ${feedbackDraft.title || labels.noSubject}\n` +
      `Email: ${FEEDBACK_EMAIL}\n\n` +
      `${feedbackDraft.message || labels.emptyMessage}`

    await navigator.clipboard.writeText(payload)
    showFeedbackStatus(labels.copied, 'success')
  }

  function openMail() {
    const subject = encodeURIComponent(feedbackDraft.title || 'Local Translator feedback')
    const body = encodeURIComponent(feedbackDraft.message || '')
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
  }

  onMount(async () => {
    settings = await getSettings()
    feedbackDraft = await getFeedbackDraft()
    await loadLabels()
    await refreshCollections()

    if (context === 'popup') {
      const shouldPrefillSelection = await consumePopupPrefillSelection()
      if (shouldPrefillSelection) {
        const lastSelection = await getLastSelection()
        if (lastSelection?.trim()) {
          sourceText = lastSelection
        }
      }
    }

    ready = true
  })
</script>

{#if ready}
  <AppShell compact={context === 'popup'} title={labels.appTitle}>
    {#if context === 'options'}
      <OptionsPage
        {labels}
        {settings}
        {feedbackDraft}
        targetLanguages={TARGET_LANGUAGES}
        interfaceLanguages={INTERFACE_LANGUAGES}
        statusText={feedbackStatusText}
        statusType={feedbackStatusType}
        onSave={async () => {
          await persistSettings()
          await saveFeedback()
        }}
        onCopy={copyFeedback}
        onMail={openMail}
      />
    {:else if route === 'translate'}
      <TranslatePage
        {labels}
        bind:sourceText
        {loading}
        {statusText}
        {statusType}
        hasFavorites={favorites.length > 0}
        onTranslate={handleTranslate}
        onClear={() => {
          sourceText = ''
          resetStatus()
        }}
        onNavigate={navigate}
      />
    {:else if route === 'result'}
      <PageFrame showBack={true} on:back={() => navigate('translate')}>
        <ResultPage
          {labels}
          {session}
          targetLanguages={TARGET_LANGUAGES}
          isFavorite={currentEntry ? favoriteIds.has(currentEntry.id) : false}
          onChangeLanguage={updateResultLanguage}
          onToggleFavorite={toggleFavoriteEntry}
        />
      </PageFrame>
    {:else if route === 'history'}
      <PageFrame showBack={true} on:back={() => navigate('translate')}>
        <CollectionPage
          {labels}
          items={history}
          emptyText={labels.historyEmpty}
          {favoriteIds}
          onOpen={openEntry}
          onToggleFavorite={toggleFavoriteEntry}
        />
      </PageFrame>
    {:else if route === 'favorites'}
      <PageFrame showBack={true} on:back={() => navigate('translate')}>
        <CollectionPage
          {labels}
          items={favorites}
          emptyText={labels.favoritesEmpty}
          {favoriteIds}
          onOpen={openEntry}
          onToggleFavorite={toggleFavoriteEntry}
        />
      </PageFrame>
    {:else if route === 'settings'}
      <PageFrame showBack={true} on:back={() => navigate('translate')}>
        <SettingsPage
          {labels}
          {settings}
          targetLanguages={TARGET_LANGUAGES}
          interfaceLanguages={INTERFACE_LANGUAGES}
          showFeedbackLink={true}
          onNavigate={navigate}
          onSettingsChange={persistPopupSettings}
        />
      </PageFrame>
    {:else if route === 'feedback'}
      <PageFrame showBack={true} on:back={() => navigate('settings')}>
        <FeedbackForm
          {labels}
          draft={feedbackDraft}
          statusText={feedbackStatusText}
          statusType={feedbackStatusType}
          onSave={saveFeedback}
        />
      </PageFrame>
    {/if}
  </AppShell>
{/if}
