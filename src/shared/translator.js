const translatorCache = new Map()
let detectorPromise

function hasTranslatorApi() {
  return typeof self !== 'undefined' && 'Translator' in self
}

function hasLanguageDetectorApi() {
  return typeof self !== 'undefined' && 'LanguageDetector' in self
}

function normalizeLanguageCode(code) {
  if (!code) {
    return 'en'
  }

  if (code === 'he') {
    return 'iw'
  }

  return code
}

function fallbackSourceLanguage(text) {
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

async function getDetector(onProgress) {
  if (!detectorPromise) {
    detectorPromise = self.LanguageDetector.create({
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', (event) => {
          onProgress?.(event.loaded)
        })
      }
    })
  }

  return detectorPromise
}

export function isLocalTranslationSupported() {
  return hasTranslatorApi()
}

export async function detectSourceLanguage(text, onProgress) {
  if (!hasLanguageDetectorApi()) {
    return fallbackSourceLanguage(text)
  }

  try {
    const detector = await getDetector(onProgress)
    const results = await detector.detect(text)
    const topMatch = results?.[0]

    if (topMatch?.detectedLanguage && topMatch.confidence >= 0.5) {
      return normalizeLanguageCode(topMatch.detectedLanguage)
    }
  } catch {
    return fallbackSourceLanguage(text)
  }

  return fallbackSourceLanguage(text)
}

async function getTranslator({ sourceLanguage, targetLanguage, onProgress }) {
  const cacheKey = `${sourceLanguage}:${targetLanguage}`

  if (!translatorCache.has(cacheKey)) {
    translatorCache.set(
      cacheKey,
      self.Translator.create({
        sourceLanguage,
        targetLanguage,
        monitor(monitor) {
          monitor.addEventListener('downloadprogress', (event) => {
            onProgress?.(event.loaded)
          })
        }
      }).then(async (translator) => {
        if (translator?.ready) {
          await translator.ready
        }

        return translator
      })
    )
  }

  return await translatorCache.get(cacheKey)
}

export async function translateText({
  text,
  sourceLanguage,
  targetLanguage,
  onProgress
}) {
  if (!hasTranslatorApi()) {
    throw new Error('Нужен Chrome 138+ на компьютере с поддержкой Built-in AI Translator API.')
  }

  const normalizedSourceLanguage = normalizeLanguageCode(
    sourceLanguage || (await detectSourceLanguage(text, onProgress))
  )
  const normalizedTargetLanguage = normalizeLanguageCode(targetLanguage)

  if (normalizedSourceLanguage === normalizedTargetLanguage) {
    return {
      translatedText: text,
      sourceLanguage: normalizedSourceLanguage,
      targetLanguage: normalizedTargetLanguage
    }
  }

  const availability = await self.Translator.availability({
    sourceLanguage: normalizedSourceLanguage,
    targetLanguage: normalizedTargetLanguage
  })

  if (availability === 'unavailable') {
    throw new Error('Эта языковая пара пока не поддерживается встроенным переводчиком Chrome.')
  }

  const translator = await getTranslator({
    sourceLanguage: normalizedSourceLanguage,
    targetLanguage: normalizedTargetLanguage,
    onProgress
  })

  const translatedText = await translator.translate(text)

  return {
    translatedText,
    sourceLanguage: normalizedSourceLanguage,
    targetLanguage: normalizedTargetLanguage
  }
}
