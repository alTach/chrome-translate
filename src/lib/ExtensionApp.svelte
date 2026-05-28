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
  import pkg from '../../package.json'
  import { FEEDBACK_EMAIL, INTERFACE_LANGUAGES, TARGET_LANGUAGES } from '@/shared/constants.js'
  import { isLocalTranslationSupported, translateText } from '@/shared/translator.js'
  import {
    addHistoryEntry,
    consumePopupPrefillSelection,
    consumePopupAutoTranslateSelection,
    getFavorites,
    getFeedbackDraft,
    getHistory,
    getLastSelection,
    getPopupSession,
    getSettings,
    ensureFavorite,
    removeFavorite,
    saveFeedbackDraft,
    savePopupSession,
    saveSettings,
  } from '@/shared/storage.js'

  export let context = 'popup'
  export let compact = null

  let route = context === 'options' ? 'options' : 'translate'
  let routeStack = []
  let labels = {}
  let ready = false
  let loading = false
  let loadingText = ''
  let statusText = ''
  let statusType = 'default'
  let feedbackStatusText = ''
  let feedbackStatusType = 'default'
  let settings = { targetLanguage: 'en', interfaceLanguage: 'ru', shortcutKey: 's' }
  let sourceText = ''
  let session = { sourceText: '', translatedText: '', targetLanguage: '', entryId: '' }
  let history = []
  let favorites = []
  let feedbackDraft = { title: '', message: '' }
  let resultLanguageAbortController = null
  let loadingToken = null
  let loadingRevealTimer = null
  let loadingShownAt = 0

  function getEntryKey(entry) {
    return JSON.stringify([
      entry?.sourceText?.trim() || '',
      entry?.translatedText?.trim() || '',
      entry?.language || ''
    ])
  }

  function buildSessionEntry() {
    if (!session.sourceText?.trim() || !session.translatedText?.trim()) {
      return null
    }

    return {
      id: session.entryId || crypto.randomUUID(),
      sourceText: session.sourceText,
      translatedText: session.translatedText,
      language: session.targetLanguage || settings.targetLanguage,
      createdAt: Date.now()
    }
  }

  $: favoriteKeys = new Set(favorites.map((item) => getEntryKey(item)))
  $: visibleLoadingText = loading ? loadingText : ''
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

  function resetLoadingText() {
    loadingText = ''
  }

  function clearLoadingRevealTimer() {
    if (loadingRevealTimer) {
      window.clearTimeout(loadingRevealTimer)
      loadingRevealTimer = null
    }
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms)
    })
  }

  function beginLoading(nextLoadingText = '') {
    const token = Symbol('loading')

    loadingToken = token
    loading = false
    loadingText = nextLoadingText
    clearLoadingRevealTimer()

    loadingRevealTimer = window.setTimeout(() => {
      if (loadingToken !== token) {
        return
      }

      loading = true
      loadingShownAt = Date.now()
      loadingRevealTimer = null
    }, 200)

    return token
  }

  async function endLoading(token) {
    if (loadingToken !== token) {
      return
    }

    clearLoadingRevealTimer()

    if (loading) {
      const visibleFor = Date.now() - loadingShownAt
      if (visibleFor < 600) {
        await wait(600 - visibleFor)
      }
    }

    if (loadingToken !== token) {
      return
    }

    loading = false
    loadingToken = null
    resetLoadingText()
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
    if (nextRoute === route) {
      resetStatus()
      return
    }

    routeStack = [...routeStack, route]
    route = nextRoute
    resetStatus()
  }

  function replaceRoute(nextRoute) {
    route = nextRoute
    resetStatus()
  }

  function goBack() {
    if (!routeStack.length) {
      route = context === 'options' ? 'options' : 'translate'
      resetStatus()
      return
    }

    const previousRoute = routeStack[routeStack.length - 1]
    routeStack = routeStack.slice(0, -1)
    route = previousRoute
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
    replaceRoute('result')
  }

  async function handleTranslate(text) {
    resetStatus()
    resetLoadingText()
    sourceText = text

    if (!sourceText.trim()) {
      return
    }

    if (!isLocalTranslationSupported()) {
      showStatus(labels.noTranslator, 'error')
      return
    }

    session = {
      sourceText,
      translatedText: '',
      targetLanguage: settings.targetLanguage,
      entryId: ''
    }
    navigate('result')
    const loadingSession = beginLoading(labels.translatorInitializing)

    try {
      const result = await translateText({
        text: sourceText,
        targetLanguage: settings.targetLanguage
      })

      await createEntry(result.translatedText, result.targetLanguage)
    } catch (error) {
      goBack()
      showStatus(error.message || labels.translationFailed, 'error')
    } finally {
      await endLoading(loadingSession)
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
    navigate('result')
  }

  async function ensureFavoriteEntry(item = currentEntry) {
    const entry = item || buildSessionEntry()

    if (!entry) {
      return
    }

    if (!history.some((historyItem) => getEntryKey(historyItem) === getEntryKey(entry))) {
      history = await addHistoryEntry(entry)
      session = await savePopupSession({
        sourceText: entry.sourceText,
        translatedText: entry.translatedText,
        targetLanguage: entry.language,
        entryId: entry.id
      })
    }

    favorites = [entry, ...favorites.filter((favorite) => getEntryKey(favorite) !== getEntryKey(entry))]
    favorites = await ensureFavorite(entry)
  }

  async function removeFavoriteEntry(item = currentEntry) {
    const entry = item || buildSessionEntry()

    if (!entry) {
      return
    }

    favorites = favorites.filter((favorite) => getEntryKey(favorite) !== getEntryKey(entry))
    favorites = await removeFavorite(entry)
  }

  async function updateResultLanguage(nextLanguage) {
    if (!session.sourceText) {
      return
    }

    resultLanguageAbortController?.abort()
    const controller = new AbortController()
    resultLanguageAbortController = controller
    resetStatus()
    const loadingSession = beginLoading(labels.translatorInitializing)

    try {
      sourceText = session.sourceText
      const result = await translateText({
        text: session.sourceText,
        targetLanguage: nextLanguage,
        signal: controller.signal,
        onProgress: () => {
          loadingText = labels.translatorInitializing
        }
      })

      if (controller.signal.aborted) {
        return
      }

      await createEntry(result.translatedText, result.targetLanguage)
      resetLoadingText()
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }

      showStatus(error.message || labels.translationFailed, 'error')
    } finally {
      if (resultLanguageAbortController === controller) {
        resultLanguageAbortController = null
      }

      await endLoading(loadingSession)
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

  async function persistFeedbackDraft() {
    await saveFeedbackDraft(feedbackDraft)
  }

  async function copyFeedback() {
    const payload =
      `Тема: ${feedbackDraft.title || labels.noSubject}\n` +
      `Кому: ${FEEDBACK_EMAIL}\n\n` +
      `${feedbackDraft.message || labels.emptyMessage}`

    await navigator.clipboard.writeText(payload)
    showFeedbackStatus(labels.copied, 'success')
  }

  function buildFeedbackMetadata() {
    return [
      `App version: ${pkg.version}`,
      `Browser: ${navigator.userAgent}`,
      `Platform: ${navigator.platform || 'unknown'}`,
      `Language: ${navigator.language || 'unknown'}`
    ].join('\n')
  }

  async function openMail() {
    await saveFeedbackDraft(feedbackDraft)

    const subject = encodeURIComponent(feedbackDraft.title || 'Local Translator feedback')
    const body = encodeURIComponent(
      [
        feedbackDraft.message || labels.emptyMessage,
        '',
        'Meta:',
        buildFeedbackMetadata()
      ].join('\n')
    )

    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
  }

  onMount(async () => {
    settings = await getSettings()
    feedbackDraft = await getFeedbackDraft()
    await loadLabels()
    await refreshCollections()

    if (context === 'popup') {
      // Run selection prefill in background to avoid blocking initial render
      void (async () => {
        const [shouldPrefillSelection, shouldAutoTranslateSelection] = await Promise.all([
          consumePopupPrefillSelection(),
          consumePopupAutoTranslateSelection()
        ])

        let selectionText = ''

        // Try to get fresh selection from active tab
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (tab?.id) {
              const response = await chrome.tabs.sendMessage(tab.id, { type: 'get-selection' })
              selectionText = response?.text || ''
            }
          } catch (error) {
            console.debug('Failed to get selection from tab:', error)
          }
        }

        // Fallback to last selection if no fresh selection or if it fails
        if (!selectionText) {
          selectionText = await getLastSelection()
        }

        if (selectionText?.trim()) {
          sourceText = selectionText

          if (shouldPrefillSelection && shouldAutoTranslateSelection) {
             void handleTranslate(selectionText)
          }
        }
      })()
    }

    ready = true
  })
</script>

{#if ready}
  <AppShell compact={compact ?? context === 'popup'} title={labels.appTitle}>
    {#if context === 'options'}
      <OptionsPage
        {labels}
        {settings}
        {feedbackDraft}
        targetLanguages={TARGET_LANGUAGES}
        interfaceLanguages={INTERFACE_LANGUAGES}
        sendLabel={labels.send}
        statusText={feedbackStatusText}
        statusType={feedbackStatusType}
        onSettingsChange={persistSettings}
        onDraftChange={persistFeedbackDraft}
        onSend={openMail}
        onCopy={copyFeedback}
      />
    {:else if route === 'translate'}
      <TranslatePage
        {labels}
        bind:sourceText
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
      <PageFrame showBack={true} on:back={goBack}>
        <ResultPage
          {labels}
          {session}
          targetLanguages={TARGET_LANGUAGES}
          isFavorite={favoriteKeys.has(getEntryKey(currentEntry || buildSessionEntry()))}
          {loading}
          loadingText={visibleLoadingText}
          onChangeLanguage={updateResultLanguage}
          onToggleFavorite={ensureFavoriteEntry}
        />
      </PageFrame>
    {:else if route === 'history'}
      <PageFrame showBack={true} on:back={goBack}>
        <CollectionPage
          {labels}
          items={history}
          emptyText={labels.historyEmpty}
          noticeText={labels.historyLimitNotice}
          {favoriteKeys}
          onOpen={openEntry}
          onToggleFavorite={ensureFavoriteEntry}
        />
      </PageFrame>
    {:else if route === 'favorites'}
      <PageFrame showBack={true} on:back={goBack}>
        <CollectionPage
          {labels}
          items={favorites}
          emptyText={labels.favoritesEmpty}
          {favoriteKeys}
          onOpen={openEntry}
          onToggleFavorite={removeFavoriteEntry}
        />
      </PageFrame>
    {:else if route === 'settings'}
      <PageFrame showBack={true} on:back={goBack}>
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
      <PageFrame showBack={true} on:back={goBack}>
        <FeedbackForm
          {labels}
          draft={feedbackDraft}
          sendLabel={labels.send}
          statusText={feedbackStatusText}
          statusType={feedbackStatusType}
          onDraftChange={persistFeedbackDraft}
          onSend={openMail}
        />
      </PageFrame>
    {/if}
  </AppShell>
{/if}
