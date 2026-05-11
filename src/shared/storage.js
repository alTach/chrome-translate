import {
  DEFAULT_SETTINGS,
  HISTORY_LIMIT,
  STORAGE_KEYS,
  getDefaultTargetLanguage
} from './constants.js'

const memoryFallback = new Map()

function getEntryKey(entry) {
  return JSON.stringify([
    entry?.sourceText?.trim() || '',
    entry?.translatedText?.trim() || '',
    entry?.language || ''
  ])
}

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome?.storage?.local
}

async function getLocalValue(key, fallbackValue) {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(key)
    return result[key] ?? fallbackValue
  }

  const raw = memoryFallback.get(key) ?? localStorage.getItem(key)
  return raw ? JSON.parse(raw) : fallbackValue
}

async function setLocalValue(key, value) {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [key]: value })
    return
  }

  const serialized = JSON.stringify(value)
  memoryFallback.set(key, serialized)
  localStorage.setItem(key, serialized)
}

export async function getSettings() {
  const defaultSettings = {
    ...DEFAULT_SETTINGS,
    targetLanguage: getDefaultTargetLanguage()
  }

  return {
    ...defaultSettings,
    ...(await getLocalValue(STORAGE_KEYS.settings, defaultSettings))
  }
}

export async function saveSettings(settings) {
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    targetLanguage: getDefaultTargetLanguage(),
    ...settings
  }
  await setLocalValue(STORAGE_KEYS.settings, nextSettings)
  return nextSettings
}

export async function getHistory() {
  return await getLocalValue(STORAGE_KEYS.history, [])
}

export async function addHistoryEntry(entry) {
  const history = await getHistory()
  const entryKey = getEntryKey(entry)
  const nextHistory = [entry, ...history.filter((item) => getEntryKey(item) !== entryKey)].slice(
    0,
    HISTORY_LIMIT
  )
  await setLocalValue(STORAGE_KEYS.history, nextHistory)
  return nextHistory
}

export async function getFavorites() {
  return await getLocalValue(STORAGE_KEYS.favorites, [])
}

export async function toggleFavorite(entry) {
  const favorites = await getFavorites()
  const entryKey = getEntryKey(entry)
  const exists = favorites.some((item) => getEntryKey(item) === entryKey)
  const nextFavorites = exists
    ? favorites.filter((item) => getEntryKey(item) !== entryKey)
    : [entry, ...favorites.filter((item) => getEntryKey(item) !== entryKey)].slice(0, HISTORY_LIMIT)

  await setLocalValue(STORAGE_KEYS.favorites, nextFavorites)
  return nextFavorites
}

export async function getFeedbackDraft() {
  return await getLocalValue(STORAGE_KEYS.feedbackDraft, {
    email: '',
    title: '',
    message: ''
  })
}

export async function saveFeedbackDraft(feedbackDraft) {
  await setLocalValue(STORAGE_KEYS.feedbackDraft, feedbackDraft)
  return feedbackDraft
}

export async function getLastSelection() {
  return await getLocalValue(STORAGE_KEYS.lastSelection, '')
}

export async function saveLastSelection(text) {
  await setLocalValue(STORAGE_KEYS.lastSelection, text)
  return text
}

export async function setPopupPrefillSelection(enabled) {
  await setLocalValue(STORAGE_KEYS.popupPrefillSelection, Boolean(enabled))
  return Boolean(enabled)
}

export async function consumePopupPrefillSelection() {
  const shouldPrefill = await getLocalValue(STORAGE_KEYS.popupPrefillSelection, false)
  await setLocalValue(STORAGE_KEYS.popupPrefillSelection, false)
  return Boolean(shouldPrefill)
}

export async function getPopupSession() {
  return await getLocalValue(STORAGE_KEYS.popupSession, {
    sourceText: '',
    translatedText: '',
    targetLanguage: '',
    entryId: ''
  })
}

export async function savePopupSession(session) {
  const nextSession = {
    sourceText: '',
    translatedText: '',
    targetLanguage: '',
    entryId: '',
    ...session
  }
  await setLocalValue(STORAGE_KEYS.popupSession, nextSession)
  return nextSession
}
