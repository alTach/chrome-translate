export const STORAGE_KEYS = {
  settings: 'deepseek-translator-settings',
  history: 'deepseek-translator-history',
  favorites: 'deepseek-translator-favorites',
  feedbackDraft: 'deepseek-translator-feedback',
  lastSelection: 'deepseek-translator-last-selection',
  popupPrefillSelection: 'deepseek-translator-popup-prefill-selection',
  popupAutoTranslateSelection: 'deepseek-translator-popup-auto-translate-selection',
  popupSession: 'deepseek-translator-popup-session',
  panelPrefs: 'deepseek-translator-panel-prefs'
}

export const PANEL_DEFAULTS = {
  width: 320,
  height: 220,
  minWidth: 280,
  minHeight: 180
}

export const TARGET_LANGUAGES = [
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
]

export const INTERFACE_LANGUAGES = TARGET_LANGUAGES
export const HISTORY_LIMIT = 20
export const SELECTION_TEXT_LIMIT = 2000
export const FEEDBACK_EMAIL = 'hello@deepseek-translator.local'

export function getDefaultTargetLanguage() {
  const browserLanguage = navigator.language?.split('-')[0]?.toLowerCase()
  return TARGET_LANGUAGES.some((language) => language.code === browserLanguage)
    ? browserLanguage
    : 'en'
}

export const DEFAULT_SETTINGS = {
  targetLanguage: getDefaultTargetLanguage(),
  interfaceLanguage: getDefaultTargetLanguage(),
  shortcutKey: 's',
  translationEngine: 'native'
}

export function getLanguageLabel(code) {
  return TARGET_LANGUAGES.find((language) => language.code === code)?.label ?? code
}
