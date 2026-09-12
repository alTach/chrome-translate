import { createSelectionTranslatorUi } from './panel.js'
import { TARGET_LANGUAGES, getLanguageLabel } from '@/shared/constants.js'
import {
  ensureFavorite,
  getSettings,
  saveLastSelection,
  savePanelPrefs
} from '@/shared/storage.js'
import {
  detectSourceLanguage,
  isLocalTranslationSupported,
  translateTextPreservingFormat
} from '@/shared/translator.js'
import { normalizeLineEndings } from '@/trash/text.js'
import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  INITIAL_PANEL_SIZE,
  ROOT_ID,
  SELECTION_TEXT_LIMIT
} from '@/trash/content/constants.js'
import { PAGE_UI_MESSAGES } from '@/trash/content/messages.js'
import {
  clampPanelPlacement,
  computePanelPlacementFromPoint,
  computePanelPlacementNearAnchor,
  computeTriggerPlacement
} from '@/trash/content/panel-placement.js'
import { computePanelSize, computeResizedPanelSize } from '@/trash/content/panel-size.js'
import {
  getRangeRect,
  getSelectedTextAndRect,
  isEditable,
  isTextInputElement
} from '@/trash/content/selection.js'

/** @type {HTMLElement|null} */
let translatorUi = null

let currentText = ''
let currentTranslatedText = ''
let statusText = ''
let statusType = 'default'
/** @type {DOMRect|null} */
let currentRect = null
/** @type {Range|null} */
let currentRange = null
/** @type {{x:number,y:number}|null} */
let currentAnchor = null
/** @type {{left:number, top:number}|null} */
let panelPlacement = null
let triggerPlacement = { left: 0, top: 0 }
let triggerVisible = false
let currentTargetLanguage = DEFAULT_TARGET_LANGUAGE
let currentSourceLanguage = DEFAULT_SOURCE_LANGUAGE
let panelOpen = false
let panelPinned = false
let favoriteActive = false
/** @type {null|{type?:string,offsetX?:number,offsetY?:number,startX?:number,startY?:number,startWidth?:number,startHeight?:number}} */
let dragState = null
let panelSize = { ...INITIAL_PANEL_SIZE }
let pageTranslatorInitialized = false

function syncUi() {
  if (!translatorUi) {
    return
  }

  translatorUi.update({
    messages: PAGE_UI_MESSAGES,
    languages: TARGET_LANGUAGES,
    triggerVisible,
    triggerLeft: triggerPlacement.left,
    triggerTop: triggerPlacement.top,
    panelVisible: panelOpen,
    panelLeft: panelPlacement?.left ?? 0,
    panelTop: panelPlacement?.top ?? 0,
    panelWidth: panelSize.width,
    panelHeight: panelSize.height,
    pinned: panelPinned,
    sourceText: currentText,
    translatedText: currentTranslatedText,
    statusText,
    statusType,
    sourceLanguage: currentSourceLanguage,
    targetLanguageLabel: getLanguageLabel(currentTargetLanguage),
    favoriteEnabled: Boolean(currentText.trim() && currentTranslatedText.trim()),
    favoriteActive
  })
}

function rememberPanelPlacement() {
  if (!panelPlacement) {
    return
  }

  panelPlacement = clampPanelPlacement(panelPlacement, panelSize)
  syncUi()
}

function refreshPanelLayout(resultText = '') {
  panelSize = computePanelSize(currentText, resultText)

  if (panelPlacement && panelOpen) {
    panelPlacement = clampPanelPlacement(panelPlacement, panelSize)
  }

  syncUi()
}

function hideTrigger() {
  triggerVisible = false
  syncUi()
}

function hidePanel() {
  panelOpen = false
  syncUi()
}

function isExtensionUiEvent(event) {
  const path = event.composedPath?.() ?? []
  return translatorUi ? path.includes(translatorUi) : false
}

function clearUi({ resetPin = true } = {}) {
  currentText = ''
  currentTranslatedText = ''
  statusText = ''
  statusType = 'default'
  currentRect = null
  currentRange = null
  currentAnchor = null
  panelPlacement = null
  dragState = null
  favoriteActive = false

  if (resetPin) {
    panelPinned = false
  }

  triggerVisible = false
  hidePanel()
  syncUi()
}

function positionPanelNearAnchor(anchor) {
  panelPlacement = computePanelPlacementNearAnchor(anchor, panelSize)
  syncUi()
}

function positionPanelFromPoint(x, y) {
  panelPlacement = computePanelPlacementFromPoint(x, y, panelSize.width, panelSize.height)
  syncUi()
}

function showTriggerAtCursor(anchor) {
  triggerPlacement = computeTriggerPlacement(anchor)
  triggerVisible = true
  syncUi()
}

function setPinState(isPinned) {
  panelPinned = isPinned
  syncUi()
}

function setStatus(message = '', type = 'default') {
  statusText = message
  statusType = type
  syncUi()
}

function createUi() {
  translatorUi = createSelectionTranslatorUi()
  translatorUi.id = ROOT_ID
  ;(document.body || document.documentElement).append(translatorUi)

  translatorUi.addEventListener('triggerclick', (event) => {
    if (!currentAnchor) {
      currentAnchor = {
        x: event.detail?.x ?? window.innerWidth / 2,
        y: event.detail?.y ?? window.innerHeight / 2
      }
    }

    void openPanel()
  })

  translatorUi.addEventListener('close', () => {
    setPinState(false)
    clearUi()
  })

  translatorUi.addEventListener('pinchange', (event) => {
    setPinState(Boolean(event.detail?.value))
  })

  translatorUi.addEventListener('source-language-change', (event) => {
    currentSourceLanguage = event.detail?.value || DEFAULT_SOURCE_LANGUAGE
    syncUi()
    void runTranslation(currentSourceLanguage)
  })

  translatorUi.addEventListener('dragstart', (event) => {
    dragState = event.detail || null
  })

  translatorUi.addEventListener('favorite', () => {
    void addCurrentFavorite()
  })

  syncUi()
}

async function loadTargetLanguage() {
  const settings = await getSettings()
  currentTargetLanguage = settings.targetLanguage || DEFAULT_TARGET_LANGUAGE
  syncUi()
}

async function addCurrentFavorite() {
  if (!currentText.trim() || !currentTranslatedText.trim()) {
    return
  }

  await ensureFavorite({
    id: crypto.randomUUID(),
    sourceText: currentText,
    translatedText: currentTranslatedText,
    language: currentTargetLanguage,
    createdAt: Date.now()
  })
  favoriteActive = true
  syncUi()
}

async function runTranslation(sourceLanguage) {
  currentTranslatedText = ''
  favoriteActive = false
  setStatus(PAGE_UI_MESSAGES.translating)

  try {
    const settings = await getSettings()
    const result = await translateTextPreservingFormat({
      text: currentText,
      sourceLanguage,
      targetLanguage: currentTargetLanguage,
      engine: settings.translationEngine
    })
    currentSourceLanguage = result.sourceLanguage
    currentTranslatedText = result.translatedText
    setStatus('')
    refreshPanelLayout(result.translatedText)
  } catch (error) {
    currentTranslatedText = ''
    setStatus(error?.message || PAGE_UI_MESSAGES.translationFailed, 'error')
  }
}

async function openPanel() {
  if (!currentText || !currentRect) {
    return
  }

  hideTrigger()
  panelOpen = true
  currentText = normalizeLineEndings(currentText)
  currentTranslatedText = ''
  favoriteActive = false
  setStatus(PAGE_UI_MESSAGES.translating)
  refreshPanelLayout('')

  const anchor = currentAnchor || {
    x: currentRect?.right ?? window.innerWidth / 2,
    y: currentRect?.bottom ?? window.innerHeight / 2
  }
  positionPanelNearAnchor(anchor)

  await loadTargetLanguage()

  if (!isLocalTranslationSupported()) {
    setStatus(PAGE_UI_MESSAGES.unsupportedBrowser, 'error')
    return
  }

  currentSourceLanguage = await detectSourceLanguage(currentText).catch(() => DEFAULT_SOURCE_LANGUAGE)
  syncUi()
  await runTranslation(currentSourceLanguage)
}

async function openTranslationFromSelection(anchorOverride = null) {
  const activeElement = document.activeElement

  if (isEditable(activeElement) && !isTextInputElement(activeElement)) {
    return
  }

  const data = getSelectedTextAndRect()

  if (!data) {
    return
  }

  const settings = await getSettings()
  currentText = data.text.slice(0, SELECTION_TEXT_LIMIT)
  currentRect = data.rect
  currentRange = data.range
  currentAnchor = anchorOverride || data.anchor
  currentTargetLanguage = settings.targetLanguage || DEFAULT_TARGET_LANGUAGE
  await saveLastSelection(currentText)
  await openPanel()
}

async function applySelectionData(data, anchorOverride = null) {
  const settings = await getSettings()
  currentText = data.text.slice(0, SELECTION_TEXT_LIMIT)
  currentRect = data.rect
  currentRange = data.range
  currentAnchor = anchorOverride || data.anchor
  currentTargetLanguage = settings.targetLanguage || DEFAULT_TARGET_LANGUAGE
  currentTranslatedText = ''
  favoriteActive = false
  await saveLastSelection(currentText)
  syncUi()
}

async function handleSelection(anchorOverride = null) {
  const activeElement = document.activeElement

  if (isEditable(activeElement) && !isTextInputElement(activeElement)) {
    if (!panelOpen) {
      clearUi()
    }

    return
  }

  const data = getSelectedTextAndRect()

  if (!data) {
    if (panelOpen && panelPinned) {
      return
    }

    clearUi()
    return
  }

  await applySelectionData(data, anchorOverride)

  if (panelOpen) {
    return
  }

  const anchor =
    anchorOverride ||
    currentAnchor || { x: data.rect.right, y: data.rect.bottom }

  showTriggerAtCursor(anchor)
}

function handlePointerDown(event) {
  if (dragState || isExtensionUiEvent(event)) {
    return
  }

  if (panelOpen && !panelPinned) {
    clearUi()
    return
  }

  if (!panelOpen) {
    clearUi()
  }
}

function handlePointerMove(event) {
  if (!dragState || !panelOpen) {
    return
  }

  if (dragState.type === 'resize') {
    panelSize = computeResizedPanelSize({
      startWidth: dragState.startWidth,
      startHeight: dragState.startHeight,
      startX: dragState.startX,
      startY: dragState.startY,
      clientX: event.clientX,
      clientY: event.clientY
    })
    positionPanelFromPoint(panelPlacement?.left ?? 0, panelPlacement?.top ?? 0)
    return
  }

  positionPanelFromPoint(
    event.clientX - dragState.offsetX,
    event.clientY - dragState.offsetY
  )
}

function handlePointerUp() {
  if (dragState && panelOpen) {
    rememberPanelPlacement()
  }

  if (dragState?.type === 'resize') {
    void savePanelPrefs({
      width: panelSize.width,
      height: panelSize.height
    })
  }

  dragState = null
}

function handleViewportChange() {
  if (panelOpen) {
    return
  }

  if (!currentRange && !currentText) {
    return
  }

  const rect = getRangeRect(currentRange, currentRect)

  if (!rect) {
    if (!panelPinned) {
      clearUi()
    }

    return
  }

  currentRect = rect
  showTriggerAtCursor(
    currentAnchor || { x: rect.right, y: rect.bottom }
  )
}

function scheduleSelectionCheck(anchorOverride = null) {
  window.setTimeout(() => {
    void handleSelection(anchorOverride)
  }, 0)
}

function isInvokeShortcut(event) {
  return (
    event.code === 'KeyS' &&
    event.altKey &&
    event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey
  )
}

function bindPageEvents() {
  let lastPointer = null
  let selectionChangeTimer = null

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'get-selection') {
      const data = getSelectedTextAndRect()
      sendResponse({ text: data?.text || '' })
      return
    }

    if (message?.type === 'invoke-translation') {
      void openTranslationFromSelection(lastPointer)
    }
  })

  document.addEventListener(
    'mouseup',
    (event) => {
      if (isExtensionUiEvent(event)) {
        return
      }

      lastPointer = { x: event.clientX, y: event.clientY }
      scheduleSelectionCheck(lastPointer)
    },
    true
  )

  document.addEventListener(
    'pointerup',
    (event) => {
      if (isExtensionUiEvent(event)) {
        return
      }

      lastPointer = { x: event.clientX, y: event.clientY }
      scheduleSelectionCheck(lastPointer)
    },
    true
  )

  document.addEventListener(
    'touchend',
    () => {
      scheduleSelectionCheck(lastPointer)
    },
    true
  )

  document.addEventListener('selectionchange', () => {
    if (selectionChangeTimer) {
      window.clearTimeout(selectionChangeTimer)
    }

    selectionChangeTimer = window.setTimeout(() => {
      selectionChangeTimer = null
      void handleSelection(lastPointer)
    }, 120)
  })

  document.addEventListener(
    'keydown',
    (event) => {
      if (!isInvokeShortcut(event)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      void openTranslationFromSelection(lastPointer)
    },
    true
  )

  document.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow') || event.key === 'Shift') {
      scheduleSelectionCheck(lastPointer)
    }
  })

  document.addEventListener('mousedown', handlePointerDown, true)
  document.addEventListener('mousemove', handlePointerMove, true)
  document.addEventListener('mouseup', handlePointerUp, true)
  window.addEventListener('scroll', handleViewportChange, true)
  window.addEventListener('resize', handleViewportChange)
}

function initPageTranslator() {
  if (pageTranslatorInitialized) {
    return
  }

  pageTranslatorInitialized = true
  createUi()
  bindPageEvents()
}

export function onExecute() {
  initPageTranslator()
}

onExecute()
