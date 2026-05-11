import { DEFAULT_SETTINGS, HISTORY_LIMIT, STORAGE_KEYS } from './constants.js';

const memoryFallback = new Map();

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome?.storage?.local;
}

async function getLocalValue(key, fallbackValue) {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? fallbackValue;
  }

  const raw = memoryFallback.get(key) ?? localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallbackValue;
}

async function setLocalValue(key, value) {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }

  const serialized = JSON.stringify(value);
  memoryFallback.set(key, serialized);
  localStorage.setItem(key, serialized);
}

export async function getSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...(await getLocalValue(STORAGE_KEYS.settings, DEFAULT_SETTINGS))
  };
}

export async function saveSettings(settings) {
  const nextSettings = { ...DEFAULT_SETTINGS, ...settings };
  await setLocalValue(STORAGE_KEYS.settings, nextSettings);
  return nextSettings;
}

export async function getHistory() {
  return await getLocalValue(STORAGE_KEYS.history, []);
}

export async function addHistoryEntry(entry) {
  const history = await getHistory();
  const nextHistory = [entry, ...history].slice(0, HISTORY_LIMIT);
  await setLocalValue(STORAGE_KEYS.history, nextHistory);
  return nextHistory;
}

export async function getFeedbackDraft() {
  return await getLocalValue(STORAGE_KEYS.feedbackDraft, {
    email: '',
    title: '',
    message: ''
  });
}

export async function saveFeedbackDraft(feedbackDraft) {
  await setLocalValue(STORAGE_KEYS.feedbackDraft, feedbackDraft);
  return feedbackDraft;
}

export async function getLastSelection() {
  return await getLocalValue(STORAGE_KEYS.lastSelection, '');
}

export async function saveLastSelection(text) {
  await setLocalValue(STORAGE_KEYS.lastSelection, text);
  return text;
}
