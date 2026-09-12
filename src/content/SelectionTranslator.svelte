<svelte:options customElement="local-translator-panel" />

<script>
  import { createEventDispatcher } from 'svelte'
  import { TRIGGER_ICON_SVG } from '@/trash/content/trigger-icon.js'

  const dispatch = createEventDispatcher()

  export let messages = {}
  export let languages = []
  export let triggerVisible = false
  export let triggerLeft = 0
  export let triggerTop = 0
  export let panelVisible = false
  export let panelLeft = 0
  export let panelTop = 0
  export let panelWidth = 320
  export let panelHeight = 220
  export let pinned = false
  export let sourceText = ''
  export let translatedText = ''
  export let statusText = ''
  export let statusType = 'default'
  export let sourceLanguage = 'en'
  export let targetLanguageLabel = ''
  export let favoriteEnabled = false
  export let favoriteActive = false

  function handleTriggerClick(event) {
    dispatch('triggerclick', { x: event.clientX, y: event.clientY })
  }

  function handlePanelMouseDown(event) {
    if (event.button !== 0) {
      return
    }

    dispatch('dragstart', {
      type: 'move',
      offsetX: event.clientX - panelLeft,
      offsetY: event.clientY - panelTop
    })
    event.preventDefault()
  }

  function handleResizeMouseDown(event) {
    if (event.button !== 0) {
      return
    }

    dispatch('dragstart', {
      type: 'resize',
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelWidth,
      startHeight: panelHeight
    })
    event.preventDefault()
    event.stopPropagation()
  }

  function handleSourceLanguageChange(event) {
    dispatch('source-language-change', { value: event.currentTarget.value })
  }
</script>

<div class="wrap">
  <button
    type="button"
    class:hidden={!triggerVisible}
    class="trigger"
    aria-label={messages.triggerLabel}
    style:left={`${triggerLeft}px`}
    style:top={`${triggerTop}px`}
    on:click={handleTriggerClick}
  >
    {@html TRIGGER_ICON_SVG}
  </button>

  <section
    class:hidden={!panelVisible}
    class="panel"
    style:left={`${panelLeft}px`}
    style:top={`${panelTop}px`}
    style:width={`${panelWidth}px`}
    style:height={`${panelHeight}px`}
  >
    <div class="panel-bar" role="button" tabindex="-1" on:mousedown={handlePanelMouseDown}>
      <div class="panel-title">{messages.panelTitle}</div>

      <div class="panel-actions">
        <button
          type="button"
          class:active={favoriteActive}
          class="panel-favorite"
          aria-label={messages.favoriteLabel}
          aria-pressed={favoriteActive}
          disabled={!favoriteEnabled}
          on:mousedown|stopPropagation
          on:click|stopPropagation={() => dispatch('favorite')}
        >
          ★
        </button>

        <button
          type="button"
          class:active={pinned}
          class="panel-pin"
          aria-label={pinned ? messages.unpinLabel : messages.pinLabel}
          aria-pressed={pinned}
          on:mousedown|stopPropagation
          on:click|stopPropagation={() => dispatch('pinchange', { value: !pinned })}
        >
          ⚲
        </button>

        <button
          type="button"
          class="panel-close"
          aria-label={messages.closeLabel}
          on:mousedown|stopPropagation
          on:click|stopPropagation={() => dispatch('close')}
        >
          ×
        </button>
      </div>
    </div>

    <div class="panel-body">
      <div class="section section-text">
        <div class="source">{sourceText}</div>
      </div>

      <div class="section section-controls">
        <div class="row">
          <select class="select" value={sourceLanguage} on:change={handleSourceLanguageChange}>
            {#each languages as language}
              <option value={language.code}>{language.label}</option>
            {/each}
          </select>
          <div class="target">{targetLanguageLabel}</div>
        </div>
      </div>

      <div class="section section-text">
        <div class="result">{translatedText}</div>
        <div class:error={statusType === 'error'} class="status">{statusText}</div>
      </div>
    </div>

    <button
      type="button"
      class="resize-handle"
      aria-label={messages.resizeLabel}
      on:mousedown={handleResizeMouseDown}
    ></button>
  </section>
</div>

<style>
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

  .trigger :global(svg) {
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
</style>
