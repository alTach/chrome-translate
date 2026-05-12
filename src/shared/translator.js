import { fallbackSourceLanguage, normalizeLanguageCode } from '@/trash/language.js'
import { normalizeLineEndings } from '@/trash/text.js'
import { TRANSLATOR_MESSAGES } from '@/trash/translator/messages.js'

const translatorCache = new Map()
let detectorPromise

function ensureActive(signal) {
  if (signal?.aborted) {
    const error = new Error('Request aborted')
    error.name = 'AbortError'
    throw error
  }
}

function hasTranslatorApi() {
  return typeof self !== 'undefined' && 'Translator' in self
}

function hasLanguageDetectorApi() {
  return typeof self !== 'undefined' && 'LanguageDetector' in self
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

async function getTranslator({ sourceLanguage, targetLanguage, onProgress, signal }) {
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

  ensureActive(signal)
  return await translatorCache.get(cacheKey)
}

export async function translateText({
  text,
  sourceLanguage,
  targetLanguage,
  onProgress,
  signal
}) {
  ensureActive(signal)

  if (!hasTranslatorApi()) {
    throw new Error(TRANSLATOR_MESSAGES.unsupportedBrowser)
  }

  const normalizedSourceLanguage = normalizeLanguageCode(
    sourceLanguage || (await detectSourceLanguage(text, onProgress))
  )
  const normalizedTargetLanguage = normalizeLanguageCode(targetLanguage)
  ensureActive(signal)

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
  ensureActive(signal)

  if (availability === 'unavailable') {
    throw new Error(TRANSLATOR_MESSAGES.pairUnavailable)
  }

  const translator = await getTranslator({
    sourceLanguage: normalizedSourceLanguage,
    targetLanguage: normalizedTargetLanguage,
    onProgress,
    signal
  })
  ensureActive(signal)

  const translatedText = await translator.translate(text)
  ensureActive(signal)

  return {
    translatedText,
    sourceLanguage: normalizedSourceLanguage,
    targetLanguage: normalizedTargetLanguage
  }
}

export async function translateTextPreservingFormat({
  text,
  sourceLanguage,
  targetLanguage,
  onProgress,
  signal
}) {
  const normalizedText = normalizeLineEndings(text)
  const segments = normalizedText.split(/(\n+)/)

  if (segments.length === 1) {
    return translateText({
      text: normalizedText,
      sourceLanguage,
      targetLanguage,
      onProgress,
      signal
    })
  }

  const translatedSegments = []
  let resolvedSourceLanguage = sourceLanguage
  let resolvedTargetLanguage = targetLanguage

  for (const segment of segments) {
    ensureActive(signal)

    if (/^\n+$/.test(segment)) {
      translatedSegments.push(segment)
      continue
    }

    if (!segment.trim()) {
      translatedSegments.push(segment)
      continue
    }

    const result = await translateText({
      text: segment,
      sourceLanguage: resolvedSourceLanguage,
      targetLanguage: resolvedTargetLanguage,
      onProgress,
      signal
    })

    resolvedSourceLanguage = result.sourceLanguage
    resolvedTargetLanguage = result.targetLanguage
    translatedSegments.push(result.translatedText)
  }

  return {
    translatedText: translatedSegments.join(''),
    sourceLanguage: resolvedSourceLanguage,
    targetLanguage: resolvedTargetLanguage
  }
}
