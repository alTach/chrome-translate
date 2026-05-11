(async () => {
  const TARGET_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ar', label: 'العربية' }
  ];

  const SETTINGS_KEY = 'deepseek-translator-settings';
  const LAST_SELECTION_KEY = 'deepseek-translator-last-selection';
  const PANEL_PREFS_KEY = 'deepseek-translator-panel-prefs';
  const POPUP_WIDTH = 320;
  const MIN_PANEL_WIDTH = 280;
  const MIN_PANEL_HEIGHT = 180;
  const OFFSET = 20;

  const translatorCache = new Map();
  let detectorPromise;

  let root;
  let shadow;
  let triggerButton;
  let panel;
  let panelBar;
  let pinButton;
  let closeButton;
  let sourceTextEl;
  let sourceLanguageSelect;
  let targetLanguageEl;
  let resultEl;
  let statusEl;

  let currentText = '';
  let currentRect = null;
  let currentRange = null;
  let currentAnchor = null;
  let currentTargetLanguage = 'ru';
  let currentSourceLanguage = 'en';
  let panelOpen = false;
  let panelPinned = false;
  let dragState = null;
  let panelSize = {
    width: POPUP_WIDTH,
    height: 220
  };

  function normalizeShortcutKey(key) {
    return (key || 's').slice(0, 1).toLowerCase();
  }

  function getLanguageLabel(code) {
    return TARGET_LANGUAGES.find((language) => language.code === code)?.label ?? code;
  }

  function normalizeLanguageCode(code) {
    if (!code) {
      return 'en';
    }

    if (code === 'he') {
      return 'iw';
    }

    return code;
  }

  function fallbackSourceLanguage(text) {
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[a-z]/i.test(text)) return 'en';
    return normalizeLanguageCode(navigator.language?.split('-')[0]) || 'en';
  }

  function isEditable(element) {
    if (!element) {
      return false;
    }

    return Boolean(
      element.closest('input, textarea, [contenteditable=""], [contenteditable="true"]')
    );
  }

  function isLocalTranslationSupported() {
    return typeof self !== 'undefined' && 'Translator' in self;
  }

  async function getSettings() {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      return {
        targetLanguage: 'ru',
        shortcutKey: 's',
        ...(result[SETTINGS_KEY] || {})
      };
    }

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return {
        targetLanguage: 'ru',
        shortcutKey: 's',
        ...(raw ? JSON.parse(raw) : {})
      };
    } catch {
      return { targetLanguage: 'ru', shortcutKey: 's' };
    }
  }

  async function saveLastSelection(text) {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      await chrome.storage.local.set({ [LAST_SELECTION_KEY]: text });
      return;
    }

    try {
      localStorage.setItem(LAST_SELECTION_KEY, JSON.stringify(text));
    } catch {}
  }

  async function getPanelPrefs() {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      const result = await chrome.storage.local.get(PANEL_PREFS_KEY);
      return {
        width: POPUP_WIDTH,
        height: 220,
        ...(result[PANEL_PREFS_KEY] || {})
      };
    }

    try {
      const raw = localStorage.getItem(PANEL_PREFS_KEY);
      return {
        width: POPUP_WIDTH,
        height: 220,
        ...(raw ? JSON.parse(raw) : {})
      };
    } catch {
      return { width: POPUP_WIDTH, height: 220 };
    }
  }

  async function savePanelPrefs(nextPrefs) {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      await chrome.storage.local.set({ [PANEL_PREFS_KEY]: nextPrefs });
      return;
    }

    try {
      localStorage.setItem(PANEL_PREFS_KEY, JSON.stringify(nextPrefs));
    } catch {}
  }

  async function getDetector() {
    if (!('LanguageDetector' in self)) {
      return null;
    }

    if (!detectorPromise) {
      detectorPromise = self.LanguageDetector.create();
    }

    return detectorPromise;
  }

  async function detectSourceLanguage(text) {
    const detector = await getDetector();
    if (!detector) {
      return fallbackSourceLanguage(text);
    }

    try {
      const results = await detector.detect(text);
      const topMatch = results?.[0];
      if (topMatch?.detectedLanguage && topMatch.confidence >= 0.5) {
        return normalizeLanguageCode(topMatch.detectedLanguage);
      }
    } catch {
      return fallbackSourceLanguage(text);
    }

    return fallbackSourceLanguage(text);
  }

  async function getTranslator(sourceLanguage, targetLanguage) {
    const key = `${sourceLanguage}:${targetLanguage}`;

    if (!translatorCache.has(key)) {
      translatorCache.set(
        key,
        self.Translator.create({
          sourceLanguage,
          targetLanguage
        }).then(async (translator) => {
          if (translator?.ready) {
            await translator.ready;
          }

          return translator;
        })
      );
    }

    return translatorCache.get(key);
  }

  async function translateText(text, sourceLanguage, targetLanguage) {
    const normalizedSourceLanguage = normalizeLanguageCode(sourceLanguage);
    const normalizedTargetLanguage = normalizeLanguageCode(targetLanguage);

    if (normalizedSourceLanguage === normalizedTargetLanguage) {
      return {
        translatedText: text,
        sourceLanguage: normalizedSourceLanguage,
        targetLanguage: normalizedTargetLanguage
      };
    }

    const availability = await self.Translator.availability({
      sourceLanguage: normalizedSourceLanguage,
      targetLanguage: normalizedTargetLanguage
    });

    if (availability === 'unavailable') {
      throw new Error('Эта языковая пара пока не поддерживается встроенным переводчиком Chrome.');
    }

    const translator = await getTranslator(normalizedSourceLanguage, normalizedTargetLanguage);
    const translatedText = await translator.translate(text);

    return {
      translatedText,
      sourceLanguage: normalizedSourceLanguage,
      targetLanguage: normalizedTargetLanguage
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function createUi() {
    root = document.createElement('div');
    root.id = 'local-translator-selection-root';
    root.style.all = 'initial';
    document.documentElement.append(root);

    shadow = root.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
      }

      .wrap {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483647;
        font-family: Manrope, "Segoe UI", sans-serif;
        color: #171717;
      }

      button,
      select {
        font: inherit;
      }

      .trigger {
        position: fixed;
        pointer-events: auto;
        border: 0;
        border-radius: 7px;
        background: #4f46e5;
        color: #fff;
        width: 30px;
        height: 30px;
        padding: 0;
        overflow: visible;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
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
        max-width: calc(100vw - 16px);
        border: 1px solid #d7d7d7;
        background: #fff;
        pointer-events: auto;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      }

      .panel-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        height: 26px;
        padding: 0 8px;
        border-bottom: 1px solid #ededed;
        background: #fafafa;
        cursor: grab;
        user-select: none;
      }

      .panel-bar:active {
        cursor: grabbing;
      }

      .panel-title {
        font-size: 11px;
        color: #8b8b8b;
      }

      .panel-close {
        border: 0;
        background: transparent;
        color: #8b8b8b;
        font-size: 14px;
        line-height: 1;
        padding: 0;
        cursor: pointer;
      }

      .panel-close:hover {
        color: #4b4b4b;
      }

      .panel-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .panel-pin {
        font-weight: 900;
        font-size: 14px;
        border: 0;
        background: transparent;
        color: #8b8b8b;
        font-size: 12px;
        line-height: 1;
        padding: 0;
        cursor: pointer;
      }

      .panel-pin:hover {
        color: #4b4b4b;
      }

      .panel-pin.active {
        color: #4f46e5;
      }

      .panel-body {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: calc(100% - 27px);
      }

      .hidden {
        display: none;
      }

      .section {
        padding: 10px 12px;
        border-bottom: 1px solid #ededed;
        min-height: 0;
      }

      .section:last-child {
        border-bottom: 0;
      }

      .section-text {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .section-controls {
        flex: 0 0 auto;
      }

      .source {
        flex: 1 1 auto;
        min-height: 0;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        overflow: auto;
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
        border: 1px solid #d7d7d7;
        background: #fff;
        color: #171717;
        padding: 6px 8px;
        font-size: 12px;
      }

      .target {
        font-size: 11px;
        color: #8b8b8b;
        white-space: nowrap;
      }

      .result {
        flex: 1 1 auto;
        min-height: 0;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        overflow: auto;
      }

      .status {
        font-size: 11px;
        color: #8b8b8b;
      }

      .error {
        color: #b42318;
      }

      .resize-handle {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 14px;
        height: 14px;
        cursor: nwse-resize;
      }

      .resize-handle::before {
        content: "";
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 7px;
        height: 7px;
        border-right: 1px solid #9a9a9a;
        border-bottom: 1px solid #9a9a9a;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    triggerButton = document.createElement('button');
    triggerButton.type = 'button';
    triggerButton.className = 'trigger hidden';
    triggerButton.setAttribute('aria-label', 'Перевести');
    triggerButton.innerHTML = `
      <svg viewBox="0 0 768 544" aria-hidden="true" focusable="false">
        <path fill="#ffffff" stroke="#ffffff" stroke-width="8" stroke-linejoin="round" d="M415.787323,417.003296 C430.605255,420.421387 444.997650,423.825378 459.442596,426.989349 C463.897247,427.965088 467.219116,430.167145 470.314270,433.478546 C496.932648,461.956818 523.248718,490.720947 550.462219,518.640015 C551.992859,520.210388 554.707092,521.583923 553.574524,524.335571 C552.460938,527.040833 549.595581,526.145081 547.359558,526.354065 C515.243042,529.355896 485.756317,520.796997 457.752441,505.856537 C456.029877,504.937561 454.541687,503.470947 453.150116,502.056793 C439.125946,487.804840 425.120728,473.533966 411.178802,459.201599 C409.220306,457.188263 407.613770,456.499817 404.686066,457.720764 C376.251556,469.579285 346.505707,474.382568 315.889435,472.039581 C296.272980,470.538330 277.243439,465.485382 259.133362,457.577148 C221.051819,440.947815 191.782669,414.418915 171.446793,378.237091 C162.545258,362.399384 155.874023,345.679779 152.433014,327.622467 C150.304153,316.450897 149.201202,305.288605 148.902390,294.003448 C148.816650,290.766022 147.691132,289.166229 144.618454,288.395355 C131.540054,285.114258 118.517403,281.608490 105.422737,278.395294 C93.621361,275.499451 81.745689,272.907288 69.921547,270.102173 C68.220100,269.698547 66.045586,269.497986 65.752159,267.163696 C65.458084,264.824097 67.637146,264.103577 69.078926,263.242310 C84.227104,254.193344 99.495506,245.345184 114.622719,236.261703 C128.179184,228.121399 141.244202,218.854324 156.211746,213.626480 C166.374908,210.076721 172.164490,203.636765 177.706985,194.774643 C198.348389,161.770264 227.053101,138.031082 263.313995,123.379890 C284.720428,114.730621 306.904633,109.866837 329.841064,109.891617 C372.467987,109.937668 410.426270,123.794456 443.539948,150.766830 C470.056885,172.365906 488.822021,199.297607 499.558044,231.791183 C501.825317,238.653152 502.854187,238.970749 509.500214,235.169647 C570.348572,200.368225 630.523193,164.417068 690.944336,128.886642 C699.268555,123.991600 707.618652,119.140129 715.984680,114.316872 C720.301147,111.828293 722.503601,112.882835 722.925842,117.835548 C724.634460,137.876266 720.802246,156.872284 711.749084,174.799881 C697.476929,203.062317 675.762085,223.694931 648.230225,239.208801 C613.997253,258.498627 580.465515,279.032013 546.611755,298.995972 C535.421387,305.595123 524.185425,312.117432 512.943970,318.629364 C506.838867,322.165924 505.462952,325.156769 506.777527,332.573853 C508.552246,333.679901 509.915771,332.461823 511.307526,331.662994 C547.841431,310.692871 584.370850,289.714966 620.893311,268.724976 C632.731506,261.921356 644.539246,255.064728 656.378052,248.262161 C662.835266,244.551849 665.033203,245.968384 665.299744,253.684021 C665.704224,265.389526 662.841431,276.385406 658.338135,287.046387 C646.753113,314.472443 626.448914,333.522461 601.024841,348.177948 C561.347290,371.049805 522.033447,394.552612 482.551422,417.764038 C479.108185,419.788361 475.430817,421.436249 472.093903,423.614014 C467.876343,426.366577 464.902283,425.334930 461.809784,421.674835 C447.636139,404.899872 438.338928,385.883911 434.978394,364.118774 C433.847992,356.797394 435.821533,349.876587 438.863983,343.306641 C448.764160,321.928223 452.222870,299.299286 449.517578,276.195953 C444.523834,233.549164 422.008148,202.294510 384.096832,182.564224 C363.268066,171.724289 340.797668,168.259949 317.325439,170.973953 C284.317169,174.790527 257.008331,189.237808 236.182434,214.967300 C221.420624,233.204865 213.360199,254.421967 210.991959,277.983795 C208.628677,301.496033 212.280960,323.912292 222.462296,344.942627 C240.414871,382.024963 270.610809,403.644867 310.756561,411.395294 C325.076630,414.159912 339.680267,413.883759 353.915192,410.639709 C365.828094,407.924866 377.423615,409.823822 389.131683,411.171539 C398.064850,412.199860 406.606506,415.101288 415.787323,417.003296 z"></path>
        <path fill="#ffffff" stroke="#ffffff" stroke-width="8" stroke-linejoin="round" d="M279.217529,222.064590 C289.884369,214.592026 301.562469,219.990494 306.545197,228.398376 C312.002808,237.607620 308.017853,248.890488 297.835541,253.918732 C288.459839,258.548676 276.912750,253.849457 272.727509,243.700729 C269.631592,236.193466 271.837524,228.569305 279.217529,222.064590 z"></path>
      </svg>
    `;
    triggerButton.addEventListener('click', () => {
      openPanel();
    });

    panel = document.createElement('div');
    panel.className = 'panel hidden';

    panelBar = document.createElement('div');
    panelBar.className = 'panel-bar';

    const panelTitle = document.createElement('div');
    panelTitle.className = 'panel-title';
    panelTitle.textContent = 'Перевод';

    const panelActions = document.createElement('div');
    panelActions.className = 'panel-actions';

    pinButton = document.createElement('button');
    pinButton.type = 'button';
    pinButton.className = 'panel-pin';
    pinButton.setAttribute('aria-label', 'Закрепить');
    pinButton.textContent = '⚲';
    pinButton.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    pinButton.addEventListener('click', () => {
      panelPinned = !panelPinned;
      pinButton.classList.toggle('active', panelPinned);
      pinButton.setAttribute('aria-label', panelPinned ? 'Открепить' : 'Закрепить');
    });

    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'panel-close';
    closeButton.setAttribute('aria-label', 'Закрыть');
    closeButton.textContent = '×';
    closeButton.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    closeButton.addEventListener('click', () => {
      panelPinned = false;
      pinButton.classList.remove('active');
      pinButton.setAttribute('aria-label', 'Закрепить');
      clearUi();
    });

    panelActions.append(pinButton, closeButton);
    panelBar.append(panelTitle, panelActions);
    panelBar.addEventListener('mousedown', (event) => {
      const path = event.composedPath?.() ?? [];
      if (path.includes(closeButton) || path.includes(pinButton)) {
        return;
      }

      dragState = {
        offsetX: event.clientX - panel.offsetLeft,
        offsetY: event.clientY - panel.offsetTop
      };
      event.preventDefault();
    });

    const sourceSection = document.createElement('div');
    sourceSection.className = 'section section-text';
    sourceTextEl = document.createElement('div');
    sourceTextEl.className = 'source';
    sourceSection.append(sourceTextEl);

    const controlsSection = document.createElement('div');
    controlsSection.className = 'section section-controls';
    const controlsRow = document.createElement('div');
    controlsRow.className = 'row';
    sourceLanguageSelect = document.createElement('select');
    sourceLanguageSelect.className = 'select';
    for (const language of TARGET_LANGUAGES) {
      const option = document.createElement('option');
      option.value = language.code;
      option.textContent = language.label;
      sourceLanguageSelect.append(option);
    }
    sourceLanguageSelect.addEventListener('change', () => {
      currentSourceLanguage = sourceLanguageSelect.value;
      runTranslation(currentSourceLanguage);
    });

    targetLanguageEl = document.createElement('div');
    targetLanguageEl.className = 'target';
    controlsRow.append(sourceLanguageSelect, targetLanguageEl);
    controlsSection.append(controlsRow);

    const resultSection = document.createElement('div');
    resultSection.className = 'section section-text';
    resultEl = document.createElement('div');
    resultEl.className = 'result';
    statusEl = document.createElement('div');
    statusEl.className = 'status';
    resultSection.append(resultEl, statusEl);

    const panelBody = document.createElement('div');
    panelBody.className = 'panel-body';
    panelBody.append(sourceSection, controlsSection, resultSection);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.addEventListener('mousedown', (event) => {
      dragState = {
        type: 'resize',
        startX: event.clientX,
        startY: event.clientY,
        startWidth: panel.offsetWidth,
        startHeight: panel.offsetHeight
      };
      event.preventDefault();
      event.stopPropagation();
    });

    panel.append(panelBar, panelBody, resizeHandle);
    wrap.append(triggerButton, panel);
    shadow.append(style, wrap);
  }

  function positionElement(element, rect, preferredWidth = 0) {
    const width = preferredWidth || panelSize.width || element.offsetWidth || POPUP_WIDTH;
    const height = panelSize.height || element.offsetHeight || 220;
    const left = clamp(rect.left, 8, window.innerWidth - width - 8);
    const top = Math.min(rect.bottom + OFFSET, window.innerHeight - height - 8);

    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  function hideTrigger() {
    triggerButton.classList.add('hidden');
  }

  function hidePanel() {
    panel.classList.add('hidden');
    panelOpen = false;
  }

  function clearUi() {
    currentText = '';
    currentRect = null;
    currentRange = null;
    currentAnchor = null;
    dragState = null;
    pinButton.classList.remove('active');
    pinButton.setAttribute('aria-label', 'Закрепить');
    hideTrigger();
    hidePanel();
  }

  function positionPanelFromPoint(x, y) {
    const width = panel.offsetWidth || panelSize.width || POPUP_WIDTH;
    const height = panel.offsetHeight || panelSize.height || 220;
    panel.style.left = `${clamp(x, 8, window.innerWidth - width - 8)}px`;
    panel.style.top = `${clamp(y, 8, window.innerHeight - height - 8)}px`;
  }

  function applyPanelSize() {
    panel.style.width = `${panelSize.width}px`;
    panel.style.height = `${panelSize.height}px`;
  }

  function getSelectionAnchorPoint(selection, rect) {
    if (!selection || selection.rangeCount === 0) {
      return { x: rect.right, y: rect.bottom };
    }

    const range = selection.getRangeAt(0);
    const endNode = range.endContainer;
    const endOffset = range.endOffset;

    try {
      if (endNode?.nodeType === Node.TEXT_NODE) {
        const probe = document.createRange();
        const startOffset = Math.max(0, endOffset - 1);
        probe.setStart(endNode, startOffset);
        probe.setEnd(endNode, endOffset);
        const probeRect = probe.getBoundingClientRect();
        if (probeRect && (probeRect.width || probeRect.height)) {
          return { x: probeRect.right, y: probeRect.bottom };
        }
      } else if (endNode?.childNodes?.length) {
        const childIndex = Math.max(0, Math.min(endOffset - 1, endNode.childNodes.length - 1));
        const childNode = endNode.childNodes[childIndex];
        if (childNode) {
          const probe = document.createRange();
          probe.selectNodeContents(childNode);
          const probeRect = probe.getBoundingClientRect();
          if (probeRect && (probeRect.width || probeRect.height)) {
            return { x: probeRect.right, y: probeRect.bottom };
          }
        }
      }
    } catch {
      return { x: rect.right, y: rect.bottom };
    }

    return { x: rect.right, y: rect.bottom };
  }

  function getCurrentSelectionRect() {
    if (!currentRange) {
      return currentRect;
    }

    try {
      const nextRect = currentRange.getBoundingClientRect();
      if (nextRect && (nextRect.width || nextRect.height)) {
        return nextRect;
      }
    } catch {
      return currentRect;
    }

    return currentRect;
  }

  async function shouldShowTrigger(text, targetLanguage) {
    const detectedLanguage = await detectSourceLanguage(text).catch(() => fallbackSourceLanguage(text));
    return normalizeLanguageCode(detectedLanguage) !== normalizeLanguageCode(targetLanguage);
  }

  function getSelectedTextAndRect() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return null;
    }

    const rawText = selection.toString();
    if (!rawText.trim()) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) {
      return null;
    }

    return {
      text: rawText,
      rect,
      range: range.cloneRange(),
      anchor: getSelectionAnchorPoint(selection, rect)
    };
  }

  async function loadTargetLanguage() {
    const settings = await getSettings();
    currentTargetLanguage = settings.targetLanguage || 'ru';
    targetLanguageEl.textContent = getLanguageLabel(currentTargetLanguage);
  }

  function showTrigger(anchor, rect) {
    const x = anchor?.x ?? rect.right;
    const y = anchor?.y ?? rect.bottom;
    triggerButton.classList.remove('hidden');
    triggerButton.style.left = `${clamp(x - 15, 8, window.innerWidth - 38)}px`;
    triggerButton.style.top = `${clamp(y + OFFSET, 8, window.innerHeight - 38)}px`;
  }

  async function runTranslation(sourceLanguage) {
    resultEl.textContent = '';
    statusEl.textContent = 'Перевод...';
    statusEl.classList.remove('error');

    try {
      const result = await translateText(currentText, sourceLanguage, currentTargetLanguage);
      currentSourceLanguage = result.sourceLanguage;
      sourceLanguageSelect.value = result.sourceLanguage;
      resultEl.textContent = result.translatedText;
      statusEl.textContent = '';
    } catch (error) {
      resultEl.textContent = '';
      statusEl.textContent = error.message || 'Не удалось перевести текст.';
      statusEl.classList.add('error');
    }
  }

  async function openPanel() {
    if (!currentText || !currentRect) {
      return;
    }

    hideTrigger();
    panel.classList.remove('hidden');
    panelOpen = true;
    applyPanelSize();
    sourceTextEl.textContent = currentText;
    resultEl.textContent = '';
    statusEl.textContent = 'Перевод...';
    statusEl.classList.remove('error');
    if (!panelPinned) {
      positionElement(panel, getCurrentSelectionRect(), POPUP_WIDTH);
    }
    await loadTargetLanguage();

    if (!isLocalTranslationSupported()) {
      statusEl.textContent = 'Нужен Chrome 138+ с поддержкой Built-in AI Translator API.';
      statusEl.classList.add('error');
      return;
    }

    currentSourceLanguage = await detectSourceLanguage(currentText).catch(() => 'en');
    sourceLanguageSelect.value = currentSourceLanguage;
    runTranslation(currentSourceLanguage);
  }

  async function openTranslationFromSelection(anchorOverride = null) {
    const activeElement = document.activeElement;
    if (isEditable(activeElement)) {
      return;
    }

    const data = getSelectedTextAndRect();
    if (!data) {
      return;
    }

    const settings = await getSettings();
    currentText = data.text.slice(0, 2000);
    currentRect = data.rect;
    currentRange = data.range;
    currentAnchor = anchorOverride || data.anchor;
    currentTargetLanguage = settings.targetLanguage || 'ru';
    saveLastSelection(currentText);
    await openPanel();
  }

  async function handleSelection(anchorOverride = null) {
    const activeElement = document.activeElement;
    if (isEditable(activeElement)) {
      if (!panelOpen) {
        clearUi();
      }
      return;
    }

    const data = getSelectedTextAndRect();
    if (!data) {
      clearUi();
      return;
    }

    const settings = await getSettings();
    const targetLanguage = settings.targetLanguage || 'ru';
    if (!(await shouldShowTrigger(data.text, targetLanguage))) {
      if (!panelOpen) {
        clearUi();
      }
      return;
    }

    currentText = data.text.slice(0, 2000);
    currentRect = data.rect;
    currentRange = data.range;
    currentAnchor = anchorOverride || data.anchor;
    currentTargetLanguage = targetLanguage;
    saveLastSelection(currentText);
    showTrigger(currentAnchor, data.rect);
  }

  function handlePointerDown(event) {
    if (dragState) {
      return;
    }

    const path = event.composedPath?.() ?? [];
    if (path.includes(root) || path.includes(triggerButton) || path.includes(panel)) {
      return;
    }

    if (panelOpen && !panelPinned) {
      clearUi();
      return;
    }

    if (!panelOpen) {
      clearUi();
    }
  }

  function handlePointerMove(event) {
    if (!dragState || !panelOpen) {
      return;
    }

    if (dragState.type === 'resize') {
      panelSize.width = clamp(
        dragState.startWidth + (event.clientX - dragState.startX),
        MIN_PANEL_WIDTH,
        window.innerWidth - 16
      );
      panelSize.height = clamp(
        dragState.startHeight + (event.clientY - dragState.startY),
        MIN_PANEL_HEIGHT,
        window.innerHeight - 16
      );
      applyPanelSize();
      positionPanelFromPoint(panel.offsetLeft, panel.offsetTop);
      return;
    }

    positionPanelFromPoint(
      event.clientX - dragState.offsetX,
      event.clientY - dragState.offsetY
    );
  }

  function handlePointerUp() {
    if (dragState?.type === 'resize') {
      savePanelPrefs({
        width: panelSize.width,
        height: panelSize.height
      });
    }
    dragState = null;
  }

  function handleViewportChange() {
    if (panelOpen) {
      if (panelPinned) {
        return;
      }

      const rect = getCurrentSelectionRect();
      if (!rect) {
        return;
      }

      currentRect = rect;
      positionElement(panel, rect, POPUP_WIDTH);
      return;
    }

    if (currentRange) {
      const rect = getCurrentSelectionRect();
      if (!rect) {
        clearUi();
        return;
      }

      currentRect = rect;
      showTrigger(currentAnchor || { x: rect.right, y: rect.bottom }, rect);
    }
  }

  createUi();
  getPanelPrefs().then((prefs) => {
    panelSize = {
      width: Math.max(MIN_PANEL_WIDTH, prefs.width || POPUP_WIDTH),
      height: Math.max(MIN_PANEL_HEIGHT, prefs.height || 220)
    };
    applyPanelSize();
  });
  if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'invoke-translation') {
        openTranslationFromSelection();
      }
    });
  }
  document.addEventListener('mouseup', (event) => {
    const anchor = { x: event.clientX, y: event.clientY };
    setTimeout(() => {
      handleSelection(anchor);
    }, 0);
  });
  document.addEventListener('keydown', async (event) => {
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const settings = await getSettings();
    const expectedKey = normalizeShortcutKey(settings.shortcutKey);
    if (event.key.toLowerCase() !== expectedKey) {
      return;
    }

    event.preventDefault();
    openTranslationFromSelection();
  });
  document.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow') || event.key === 'Shift') {
      setTimeout(handleSelection, 0);
    }
  });
  document.addEventListener('mousedown', handlePointerDown, true);
  document.addEventListener('mousemove', handlePointerMove, true);
  document.addEventListener('mouseup', handlePointerUp, true);
  window.addEventListener('scroll', handleViewportChange, true);
  window.addEventListener('resize', handleViewportChange);
})();
