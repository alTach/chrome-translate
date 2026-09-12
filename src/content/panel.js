import { TRIGGER_ICON_SVG } from '@/trash/content/trigger-icon.js'

const STYLE = `
  :host {
    all: initial;
  }

  .wrap {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    color: #171717;
    font-family: Manrope, "Segoe UI", sans-serif;
    pointer-events: none;
  }

  button,
  select {
    font: inherit;
  }

  .hidden {
    display: none !important;
  }

  .trigger {
    position: fixed;
    width: 30px;
    height: 30px;
    padding: 0;
    overflow: visible;
    color: #fff;
    background: #4f46e5;
    border: 0;
    border-radius: 7px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    pointer-events: auto;
  }

  .trigger:hover {
    background: #4338ca;
  }

  .trigger svg {
    display: block;
    width: 32px;
    height: 32px;
    margin: -1px;
  }

  .panel {
    position: fixed;
    box-sizing: border-box;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    overflow: hidden;
    background: #fff;
    border: 1px solid #d7d7d7;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    pointer-events: auto;
  }

  .panel-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 26px;
    padding: 0 8px;
    background: #fafafa;
    border-bottom: 1px solid #ededed;
    cursor: grab;
    gap: 8px;
    user-select: none;
  }

  .panel-bar:active {
    cursor: grabbing;
  }

  .panel-title {
    color: #8b8b8b;
    font-size: 11px;
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-favorite,
  .panel-pin,
  .panel-close {
    padding: 0;
    color: #8b8b8b;
    background: transparent;
    border: 0;
    cursor: pointer;
    line-height: 1;
  }

  .panel-favorite {
    font-size: 13px;
  }

  .panel-pin {
    font-size: 12px;
    font-weight: 900;
  }

  .panel-close {
    font-size: 14px;
  }

  .panel-favorite:hover:not(:disabled),
  .panel-pin:hover,
  .panel-close:hover {
    color: #4b4b4b;
  }

  .panel-favorite:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  .panel-favorite.active {
    color: #d97706;
  }

  .panel-pin.active {
    color: #4f46e5;
    background: #eef2ff;
    border-radius: 4px;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: calc(100% - 27px);
  }

  .section {
    min-height: 0;
    padding: 10px 12px;
    border-bottom: 1px solid #ededed;
  }

  .section:last-child {
    border-bottom: 0;
  }

  .section-text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
  }

  .section-controls {
    flex: 0 0 auto;
  }

  .source,
  .result {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .select {
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    color: #171717;
    background: #fff;
    border: 1px solid #d7d7d7;
    font-size: 12px;
  }

  .target {
    color: #8b8b8b;
    font-size: 11px;
    white-space: nowrap;
  }

  .status {
    min-height: 15px;
    margin-top: 6px;
    color: #8b8b8b;
    font-size: 11px;
  }

  .status.error {
    color: #b42318;
  }

  .resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 2;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    pointer-events: auto;
    border: 0;
    background: none;
  }

  .resize-handle::before {
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 7px;
    height: 7px;
    border-right: 1px solid #9a9a9a;
    border-bottom: 1px solid #9a9a9a;
    content: "";
  }
`

function dispatch(host, type, detail) {
  host.dispatchEvent(new CustomEvent(type, { detail }))
}

function setHidden(element, hidden) {
  element.classList.toggle('hidden', hidden)
}

function setActive(element, active) {
  element.classList.toggle('active', active)
}

export function createSelectionTranslatorUi() {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })

  shadow.innerHTML = `
    <style>${STYLE}</style>
    <div class="wrap">
      <button type="button" class="trigger hidden">${TRIGGER_ICON_SVG}</button>
      <section class="panel hidden">
        <div class="panel-bar" role="button" tabindex="-1">
          <div class="panel-title"></div>
          <div class="panel-actions">
            <button type="button" class="panel-favorite">★</button>
            <button type="button" class="panel-pin">⚲</button>
            <button type="button" class="panel-close">×</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="section section-text">
            <div class="source"></div>
          </div>
          <div class="section section-controls">
            <div class="row">
              <select class="select"></select>
              <div class="target"></div>
            </div>
          </div>
          <div class="section section-text">
            <div class="result"></div>
            <div class="status"></div>
          </div>
        </div>
        <button type="button" class="resize-handle"></button>
      </section>
    </div>
  `

  const trigger = shadow.querySelector('.trigger')
  const panel = shadow.querySelector('.panel')
  const panelBar = shadow.querySelector('.panel-bar')
  const favoriteButton = shadow.querySelector('.panel-favorite')
  const pinButton = shadow.querySelector('.panel-pin')
  const closeButton = shadow.querySelector('.panel-close')
  const source = shadow.querySelector('.source')
  const result = shadow.querySelector('.result')
  const status = shadow.querySelector('.status')
  const select = shadow.querySelector('.select')
  const target = shadow.querySelector('.target')
  const title = shadow.querySelector('.panel-title')
  const resizeHandle = shadow.querySelector('.resize-handle')

  let state = {
    messages: {},
    languages: [],
    panelLeft: 0,
    panelTop: 0,
    panelWidth: 320,
    panelHeight: 220,
    pinned: false,
    sourceLanguage: 'en'
  }

  trigger.addEventListener('click', (event) => {
    dispatch(host, 'triggerclick', { x: event.clientX, y: event.clientY })
  })

  panelBar.addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return
    }

    dispatch(host, 'dragstart', {
      type: 'move',
      offsetX: event.clientX - state.panelLeft,
      offsetY: event.clientY - state.panelTop
    })
    event.preventDefault()
  })

  resizeHandle.addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return
    }

    dispatch(host, 'dragstart', {
      type: 'resize',
      startX: event.clientX,
      startY: event.clientY,
      startWidth: state.panelWidth,
      startHeight: state.panelHeight
    })
    event.preventDefault()
    event.stopPropagation()
  })

  favoriteButton.addEventListener('mousedown', (event) => event.stopPropagation())
  favoriteButton.addEventListener('click', (event) => {
    event.stopPropagation()
    dispatch(host, 'favorite')
  })

  pinButton.addEventListener('mousedown', (event) => event.stopPropagation())
  pinButton.addEventListener('click', (event) => {
    event.stopPropagation()
    dispatch(host, 'pinchange', { value: !state.pinned })
  })

  closeButton.addEventListener('mousedown', (event) => event.stopPropagation())
  closeButton.addEventListener('click', (event) => {
    event.stopPropagation()
    dispatch(host, 'close')
  })

  select.addEventListener('change', (event) => {
    dispatch(host, 'source-language-change', { value: event.currentTarget.value })
  })

  host.update = (nextState) => {
    state = { ...state, ...nextState }
    const messages = state.messages || {}

    setHidden(trigger, !state.triggerVisible)
    trigger.style.left = `${state.triggerLeft || 0}px`
    trigger.style.top = `${state.triggerTop || 0}px`
    trigger.setAttribute('aria-label', messages.triggerLabel || '')

    setHidden(panel, !state.panelVisible)
    panel.style.left = `${state.panelLeft || 0}px`
    panel.style.top = `${state.panelTop || 0}px`
    panel.style.width = `${state.panelWidth || 320}px`
    panel.style.height = `${state.panelHeight || 220}px`

    title.textContent = messages.panelTitle || ''
    source.textContent = state.sourceText || ''
    result.textContent = state.translatedText || ''
    status.textContent = state.statusText || ''
    status.classList.toggle('error', state.statusType === 'error')
    target.textContent = state.targetLanguageLabel || ''

    favoriteButton.disabled = !state.favoriteEnabled
    favoriteButton.setAttribute('aria-label', messages.favoriteLabel || '')
    favoriteButton.setAttribute('aria-pressed', String(Boolean(state.favoriteActive)))
    setActive(favoriteButton, Boolean(state.favoriteActive))

    pinButton.setAttribute('aria-label', state.pinned ? messages.unpinLabel || '' : messages.pinLabel || '')
    pinButton.setAttribute('aria-pressed', String(Boolean(state.pinned)))
    setActive(pinButton, Boolean(state.pinned))

    closeButton.setAttribute('aria-label', messages.closeLabel || '')
    resizeHandle.setAttribute('aria-label', messages.resizeLabel || '')

    const languages = state.languages || []
    const currentOptions = Array.from(select.options)
    const needsOptionsUpdate =
      currentOptions.length !== languages.length ||
      currentOptions.some((option, index) => option.value !== languages[index]?.code)

    if (needsOptionsUpdate) {
      select.replaceChildren(
        ...languages.map((language) => {
          const option = document.createElement('option')
          option.value = language.code
          option.textContent = language.label
          return option
        })
      )
    }

    select.value = state.sourceLanguage || 'en'
  }

  return host
}
