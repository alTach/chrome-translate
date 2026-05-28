import { TARGET_LANGUAGES, getLanguageLabel } from '@/shared/constants.js'
import {
  getSettings,
  saveLastSelection,
  savePanelPrefs,
  setPopupPrefillSelection
} from '@/shared/storage.js'
import {
  detectSourceLanguage,
  isLocalTranslationSupported,
  translateTextPreservingFormat
} from '@/shared/translator.js'
import { languagesDiffer } from '@/trash/language.js'
import { normalizeLineEndings, setFormattedText } from '@/trash/text.js'
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
import { PANEL_STYLES } from '@/trash/content/panel-styles.js'
import {
  getRangeRect,
  getSelectedTextAndRect,
  isEditable,
  isTextInputElement
} from '@/trash/content/selection.js'
import { TRIGGER_ICON_SVG } from '@/trash/content/trigger-icon.js'

/** @type {HTMLElement|null} */
let root = null
/** @type {ShadowRoot|null} */
let shadow = null
/** @type {HTMLButtonElement|null} */
let triggerButton = null
/** @type {HTMLElement|null} */
let panel = null
/** @type {HTMLElement|null} */
let panelBar = null
/** @type {HTMLButtonElement|null} */
let pinButton = null
/** @type {HTMLButtonElement|null} */
let closeButton = null
/** @type {HTMLElement|null} */
let sourceTextEl = null
/** @type {HTMLSelectElement|null} */
let sourceLanguageSelect = null
/** @type {HTMLElement|null} */
let targetLanguageEl = null
/** @type {HTMLElement|null} */
let resultEl = null
/** @type {HTMLElement|null} */
let statusEl = null

let currentText = ''
/** @type {DOMRect|null} */
let currentRect = null
/** @type {Range|null} */
let currentRange = null
/** @type {{x:number,y:number}|null} */
let currentAnchor = null
/** @type {{left:number, top:number}|null} */
let panelPlacement = null
let currentTargetLanguage = DEFAULT_TARGET_LANGUAGE
let currentSourceLanguage = DEFAULT_SOURCE_LANGUAGE
let panelOpen = false
let panelPinned = false
/** @type {null|{type?:string,offsetX?:number,offsetY?:number,startX?:number,startY?:number,startWidth?:number,startHeight?:number}} */
let dragState = null
let panelSize = { ...INITIAL_PANEL_SIZE }
let pageTranslatorInitialized = false

function applyPanelSize() {
  panel.style.width = `${panelSize.width}px`
  panel.style.height = `${panelSize.height}px`
}

function applyPanelPlacement() {
  if (!panelPlacement) {
    return
  }

  panel.style.left = `${panelPlacement.left}px`
  panel.style.top = `${panelPlacement.top}px`
}

function rememberPanelPlacement() {
  panelPlacement = {
    left: panel.offsetLeft,
    top: panel.offsetTop
  }
}

function refreshPanelLayout(resultText = '') {
  panelSize = computePanelSize(currentText, resultText)
  applyPanelSize()

  if (!panelPlacement || !panelOpen) {
    return
  }

  panelPlacement = clampPanelPlacement(panelPlacement, panelSize)
  applyPanelPlacement()
}

function hideTrigger() {
  triggerButton?.classList.add('hidden')
}

function hidePanel() {
  panel?.classList.add('hidden')
  panelOpen = false
}

function isExtensionUiEvent(event) {
  const path = event.composedPath?.() ?? []
  return path.includes(root)
}

function clearUi({ resetPin = true } = {}) {
  currentText = ''
  currentRect = null
  currentRange = null
  currentAnchor = null
  panelPlacement = null
  dragState = null

  if (resetPin) {
    panelPinned = false
    pinButton?.classList.remove('active')
    pinButton?.setAttribute('aria-pressed', 'false')
    pinButton?.setAttribute('aria-label', PAGE_UI_MESSAGES.pinLabel)
  }

  hideTrigger()
  hidePanel()
}

function positionPanelNearAnchor(anchor) {
  panelPlacement = computePanelPlacementNearAnchor(anchor, panelSize)
  applyPanelSize()
  applyPanelPlacement()
}

function positionPanelFromPoint(x, y) {
  panelPlacement = computePanelPlacementFromPoint(
    x,
    y,
    panel.offsetWidth || panelSize.width,
    panel.offsetHeight || panelSize.height
  )
  applyPanelPlacement()
}

function showTriggerAtCursor(anchor) {
  const placement = computeTriggerPlacement(anchor)
  triggerButton.classList.remove('hidden')
  triggerButton.style.left = `${placement.left}px`
  triggerButton.style.top = `${placement.top}px`
}

function setPinState(isPinned) {
  panelPinned = isPinned
  pinButton.classList.toggle('active', panelPinned)
  pinButton.setAttribute('aria-pressed', String(panelPinned))
  pinButton.setAttribute(
    'aria-label',
    panelPinned ? PAGE_UI_MESSAGES.unpinLabel : PAGE_UI_MESSAGES.pinLabel
  )
}

function createUi() {
  root = document.createElement('div')
  root.id = ROOT_ID
  root.style.all = 'initial'
  ;(document.body || document.documentElement).append(root)

  shadow = root.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = PANEL_STYLES

  const wrap = document.createElement('div')
  wrap.className = 'wrap'

  triggerButton = document.createElement('button')
  triggerButton.type = 'button'
  triggerButton.className = 'trigger hidden'
  triggerButton.setAttribute('aria-label', PAGE_UI_MESSAGES.triggerLabel)
  triggerButton.innerHTML = TRIGGER_ICON_SVG
  triggerButton.addEventListener('click', (event) => {
    if (!currentAnchor) {
      currentAnchor = { x: event.clientX, y: event.clientY }
    }

    void openPanel()
  })

  panel = document.createElement('div')
  panel.className = 'panel hidden'

  panelBar = document.createElement('div')
  panelBar.className = 'panel-bar'

  const panelTitle = document.createElement('div')
  panelTitle.className = 'panel-title'
  panelTitle.textContent = PAGE_UI_MESSAGES.panelTitle

  const panelActions = document.createElement('div')
  panelActions.className = 'panel-actions'

  pinButton = document.createElement('button')
  pinButton.type = 'button'
  pinButton.className = 'panel-pin'
  pinButton.setAttribute('aria-label', PAGE_UI_MESSAGES.pinLabel)
  pinButton.setAttribute('aria-pressed', 'false')
  pinButton.textContent = '⚲'
  pinButton.addEventListener('mousedown', (event) => event.stopPropagation())
  pinButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    setPinState(!panelPinned)
  })

  closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'panel-close'
  closeButton.setAttribute('aria-label', PAGE_UI_MESSAGES.closeLabel)
  closeButton.textContent = '×'
  closeButton.addEventListener('mousedown', (event) => event.stopPropagation())
  closeButton.addEventListener('click', () => {
    setPinState(false)
    clearUi()
  })

  panelActions.append(pinButton, closeButton)
  panelBar.append(panelTitle, panelActions)
  panelBar.addEventListener('mousedown', (event) => {
    const path = event.composedPath?.() ?? []

    if (path.includes(closeButton) || path.includes(pinButton)) {
      return
    }

    dragState = {
      type: 'move',
      offsetX: event.clientX - panel.offsetLeft,
      offsetY: event.clientY - panel.offsetTop
    }
    event.preventDefault()
  })

  const sourceSection = document.createElement('div')
  sourceSection.className = 'section section-text'
  sourceTextEl = document.createElement('div')
  sourceTextEl.className = 'source'
  sourceSection.append(sourceTextEl)

  const controlsSection = document.createElement('div')
  controlsSection.className = 'section section-controls'
  const controlsRow = document.createElement('div')
  controlsRow.className = 'row'
  sourceLanguageSelect = document.createElement('select')
  sourceLanguageSelect.className = 'select'

  for (const language of TARGET_LANGUAGES) {
    const option = document.createElement('option')
    option.value = language.code
    option.textContent = language.label
    sourceLanguageSelect.append(option)
  }

  sourceLanguageSelect.addEventListener('change', () => {
    currentSourceLanguage = sourceLanguageSelect.value
    void runTranslation(currentSourceLanguage)
  })

  targetLanguageEl = document.createElement('div')
  targetLanguageEl.className = 'target'
  controlsRow.append(sourceLanguageSelect, targetLanguageEl)
  controlsSection.append(controlsRow)

  const resultSection = document.createElement('div')
  resultSection.className = 'section section-text'
  resultEl = document.createElement('div')
  resultEl.className = 'result'
  statusEl = document.createElement('div')
  statusEl.className = 'status'
  resultSection.append(resultEl, statusEl)

  const panelBody = document.createElement('div')
  panelBody.className = 'panel-body'
  panelBody.append(sourceSection, controlsSection, resultSection)

  const resizeHandle = document.createElement('div')
  resizeHandle.className = 'resize-handle'
  resizeHandle.setAttribute('aria-label', PAGE_UI_MESSAGES.resizeLabel)
  resizeHandle.addEventListener('mousedown', (event) => {
    dragState = {
      type: 'resize',
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panel.offsetWidth,
      startHeight: panel.offsetHeight
    }
    event.preventDefault()
    event.stopPropagation()
  })

  panel.append(panelBar, panelBody, resizeHandle)
  wrap.append(triggerButton, panel)
  shadow.append(style, wrap)
}

async function loadTargetLanguage() {
  const settings = await getSettings()
  currentTargetLanguage = settings.targetLanguage || DEFAULT_TARGET_LANGUAGE
  targetLanguageEl.textContent = getLanguageLabel(currentTargetLanguage)
}

async function shouldShowTrigger(text, targetLanguage) {
  const detectedLanguage = await detectSourceLanguage(text).catch(() => DEFAULT_SOURCE_LANGUAGE)
  return languagesDiffer(detectedLanguage, targetLanguage)
}

async function runTranslation(sourceLanguage) {
  setFormattedText(resultEl, '')
  statusEl.textContent = PAGE_UI_MESSAGES.translating
  statusEl.classList.remove('error')

  try {
    const result = await translateTextPreservingFormat({
      text: currentText,
      sourceLanguage,
      targetLanguage: currentTargetLanguage
    })
    currentSourceLanguage = result.sourceLanguage
    sourceLanguageSelect.value = result.sourceLanguage
    setFormattedText(resultEl, result.translatedText)
    statusEl.textContent = ''
    refreshPanelLayout(result.translatedText)
  } catch (error) {
    setFormattedText(resultEl, '')
    statusEl.textContent = error?.message || PAGE_UI_MESSAGES.translationFailed
    statusEl.classList.add('error')
  }
}

async function openPanel() {
  if (!currentText || !currentRect) {
    return
  }

  hideTrigger()
  panel.classList.remove('hidden')
  panelOpen = true
  currentText = normalizeLineEndings(currentText)
  setFormattedText(sourceTextEl, currentText)
  setFormattedText(resultEl, '')
  statusEl.textContent = PAGE_UI_MESSAGES.translating
  statusEl.classList.remove('error')
  refreshPanelLayout('')

  const anchor = currentAnchor || {
    x: currentRect?.right ?? window.innerWidth / 2,
    y: currentRect?.bottom ?? window.innerHeight / 2
  }
  positionPanelNearAnchor(anchor)

  await loadTargetLanguage()

  if (!isLocalTranslationSupported()) {
    statusEl.textContent = PAGE_UI_MESSAGES.unsupportedBrowser
    statusEl.classList.add('error')
    return
  }

  currentSourceLanguage = await detectSourceLanguage(currentText).catch(() => DEFAULT_SOURCE_LANGUAGE)
  sourceLanguageSelect.value = currentSourceLanguage
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
  await saveLastSelection(currentText)
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

  const settings = await getSettings()
  const targetLanguage = settings.targetLanguage || DEFAULT_TARGET_LANGUAGE

  if (!(await shouldShowTrigger(data.text, targetLanguage))) {
    if (!panelOpen) {
      clearUi()
    }

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
    applyPanelSize()
    positionPanelFromPoint(panel.offsetLeft, panel.offsetTop)
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

function bindPageEvents() {
  const lastPointer = { x: 0, y: 0 }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'get-selection') {
      const data = getSelectedTextAndRect()
      sendResponse({ text: data?.text || '' })
      return
    }

    if (message?.type === 'invoke-translation') {
      void setPopupPrefillSelection(true)
      void openTranslationFromSelection({ x: lastPointer.x, y: lastPointer.y })
    }
  })

  document.addEventListener(
    'mouseup',
    (event) => {
      if (isExtensionUiEvent(event)) {
        return
      }

      lastPointer.x = event.clientX
      lastPointer.y = event.clientY
      window.setTimeout(() => {
        void handleSelection({ x: event.clientX, y: event.clientY })
      }, 0)
    },
    true
  )

  document.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow') || event.key === 'Shift') {
      window.setTimeout(() => {
        void handleSelection({ x: lastPointer.x, y: lastPointer.y })
      }, 0)
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
