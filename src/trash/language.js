export function normalizeLanguageCode(code) {
  if (!code) {
    return 'en'
  }

  return code === 'he' ? 'iw' : code
}

export function fallbackSourceLanguage(text) {
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru'
  }

  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) {
    return 'ja'
  }

  if (/[\uac00-\ud7af]/.test(text)) {
    return 'ko'
  }

  if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh'
  }

  if (/[a-z]/i.test(text)) {
    return 'en'
  }

  return normalizeLanguageCode(navigator.language?.split('-')[0]) || 'en'
}

export function languagesDiffer(sourceLanguage, targetLanguage) {
  return normalizeLanguageCode(sourceLanguage) !== normalizeLanguageCode(targetLanguage)
}
