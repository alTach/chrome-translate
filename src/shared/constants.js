export const STORAGE_KEYS = {
  settings: 'deepseek-translator-settings',
  history: 'deepseek-translator-history',
  favorites: 'deepseek-translator-favorites',
  feedbackDraft: 'deepseek-translator-feedback',
  lastSelection: 'deepseek-translator-last-selection',
  popupPrefillSelection: 'deepseek-translator-popup-prefill-selection',
  popupSession: 'deepseek-translator-popup-session'
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
export const HISTORY_LIMIT = 10
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
  shortcutKey: 's'
}

export function getLanguageLabel(code) {
  return TARGET_LANGUAGES.find((language) => language.code === code)?.label ?? code
}
