import {
  DEFAULT_SETTINGS,
  HISTORY_LIMIT,
  PANEL_DEFAULTS,
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

function isValidEntry(entry) {
  return Boolean(
    entry?.sourceText?.trim() &&
    entry?.translatedText?.trim() &&
    entry?.language
  )
}

function normalizeEntries(entries = []) {
  const validEntries = entries.filter(isValidEntry)
  const seenKeys = new Set()

  return validEntries.filter((entry) => {
    const entryKey = getEntryKey(entry)

    if (seenKeys.has(entryKey)) {
      return false
    }

    seenKeys.add(entryKey)
    return true
  })
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
  const defaultSettings = DEFAULT_SETTINGS

  return {
    ...defaultSettings,
    ...(await getLocalValue(STORAGE_KEYS.settings, defaultSettings))
  }
}

export async function saveSettings(settings) {
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...settings
  }
  await setLocalValue(STORAGE_KEYS.settings, nextSettings)
  return nextSettings
}

export async function getHistory() {
  const history = normalizeEntries(await getLocalValue(STORAGE_KEYS.history, []))
  await setLocalValue(STORAGE_KEYS.history, history)
  return history
}

export async function addHistoryEntry(entry) {
  if (!isValidEntry(entry)) {
    return await getHistory()
  }

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
  const favorites = normalizeEntries(await getLocalValue(STORAGE_KEYS.favorites, []))
  await setLocalValue(STORAGE_KEYS.favorites, favorites)
  return favorites
}

export async function ensureFavorite(entry) {
  if (!isValidEntry(entry)) {
    return await getFavorites()
  }

  const favorites = await getFavorites()
  const entryKey = getEntryKey(entry)
  const nextFavorites = [entry, ...favorites.filter((item) => getEntryKey(item) !== entryKey)].slice(
    0,
    HISTORY_LIMIT
  )

  await setLocalValue(STORAGE_KEYS.favorites, nextFavorites)
  return nextFavorites
}

export async function removeFavorite(entry) {
  if (!isValidEntry(entry)) {
    return await getFavorites()
  }

  const favorites = await getFavorites()
  const entryKey = getEntryKey(entry)
  const nextFavorites = favorites.filter((item) => getEntryKey(item) !== entryKey)

  await setLocalValue(STORAGE_KEYS.favorites, nextFavorites)
  return nextFavorites
}

export async function getFeedbackDraft() {
  return await getLocalValue(STORAGE_KEYS.feedbackDraft, {
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

export async function setPopupAutoTranslateSelection(enabled) {
  await setLocalValue(STORAGE_KEYS.popupAutoTranslateSelection, Boolean(enabled))
  return Boolean(enabled)
}

export async function consumePopupAutoTranslateSelection() {
  const shouldTranslate = await getLocalValue(STORAGE_KEYS.popupAutoTranslateSelection, false)
  await setLocalValue(STORAGE_KEYS.popupAutoTranslateSelection, false)
  return Boolean(shouldTranslate)
}

export async function getPopupSession() {
  return await getLocalValue(STORAGE_KEYS.popupSession, {
    sourceText: '',
    translatedText: '',
    targetLanguage: '',
    entryId: ''
  })
}

export async function getPanelPrefs() {
  const prefs = await getLocalValue(STORAGE_KEYS.panelPrefs, {
    width: PANEL_DEFAULTS.width,
    height: PANEL_DEFAULTS.height
  })

  return {
    width: PANEL_DEFAULTS.width,
    height: PANEL_DEFAULTS.height,
    ...prefs
  }
}

export async function savePanelPrefs(prefs) {
  const nextPrefs = {
    width: PANEL_DEFAULTS.width,
    height: PANEL_DEFAULTS.height,
    ...prefs
  }
  await setLocalValue(STORAGE_KEYS.panelPrefs, nextPrefs)
  return nextPrefs
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
