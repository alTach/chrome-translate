import { translateUiMessage } from '@/shared/interface-language.js'

export const UI_MESSAGES = {
  appTitle: 'Local Translator',
  back: 'Назад',
  clear: 'Очистить',
  translate: 'Перевести',
  settings: 'Настройки',
  history: 'История',
  favorites: 'Избранное',
  feedback: 'Обратная связь',
  send: 'Отправить',
  copied: 'Текст обратной связи скопирован.',
  copiedShort: 'Скопировать',
  targetLanguage: 'Язык перевода',
  defaultTargetLanguage: 'Язык перевода по умолчанию',
  interfaceLanguage: 'Язык интерфейса',
  shortcut: 'Горячая клавиша',
  sourcePlaceholder: 'Введите текст',
  noTranslator: 'Нужен Chrome 138+ на компьютере. На мобильных браузерах API не работает.',
  translationFailed: 'Не удалось перевести текст.',
  translatorInitializing: 'Словарь инициализируется. Подождите немного.',
  pageTranslatorLoading: 'Переводим выделенный текст...',
  pageTranslatorTitle: 'Перевод',
  close: 'Закрыть',
  noData: 'Нет данных для отображения.',
  historyEmpty: 'История пуста',
  historyLimitNotice: 'до 20',
  favoritesEmpty: 'Избранное пусто',
  addFavorite: 'Добавить в избранное',
  removeFavorite: 'Убрать из избранного',
  feedbackTitle: 'Заголовок',
  feedbackMessage: 'Сообщение',
  feedbackEmail: 'Почта',
  saveSuccess: 'Сохранено.',
  shortcutHint: 'Нажмите клавишу, пока блок в фокусе',
  noSubject: 'Без темы',
  emptyMessage: 'Сообщение пока пустое.',
  feedbackPageTitle: 'Обратная связь',
  translationEngine: 'Движок перевода',
  engineNative: 'Chrome Built-in AI',
  engineGoogle: 'Google Translate'
}

export async function buildMessages(language) {
  const entries = await Promise.all(
    Object.entries(UI_MESSAGES).map(async ([key, value]) => [key, await translateUiMessage(value, language)])
  )

  return Object.fromEntries(entries)
}
