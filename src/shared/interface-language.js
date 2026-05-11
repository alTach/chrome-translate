import { isLocalTranslationSupported, translateText } from './translator.js'

const uiTranslationCache = new Map()

async function translateFromRussian(text, targetLanguage) {
  const normalizedText = String(text || '').trim()
  const normalizedTargetLanguage = targetLanguage || 'ru'

  if (!normalizedText || normalizedTargetLanguage === 'ru') {
    return text
  }

  const cacheKey = `${normalizedTargetLanguage}:${normalizedText}`
  if (uiTranslationCache.has(cacheKey)) {
    return uiTranslationCache.get(cacheKey)
  }

  if (!isLocalTranslationSupported()) {
    return text
  }

  try {
    const result = await translateText({
      text: normalizedText,
      sourceLanguage: 'ru',
      targetLanguage: normalizedTargetLanguage
    })
    uiTranslationCache.set(cacheKey, result.translatedText)
    return result.translatedText
  } catch {
    return text
  }
}

export async function translateUiMessage(text, targetLanguage) {
  return await translateFromRussian(text, targetLanguage)
}
