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
  save: 'Сохранить',
  copied: 'Текст обратной связи скопирован.',
  copiedShort: 'Скопировать',
  mail: 'Почта',
  targetLanguage: 'Язык перевода',
  defaultTargetLanguage: 'Язык перевода по умолчанию',
  interfaceLanguage: 'Язык интерфейса',
  shortcut: 'Горячая клавиша',
  sourcePlaceholder: 'Введите текст',
  emptyInput: 'Введите текст для перевода.',
  noTranslator: 'Нужен Chrome 138+ на компьютере. На мобильных браузерах API не работает.',
  translationFailed: 'Не удалось перевести текст.',
  noData: 'Нет данных для отображения.',
  historyEmpty: 'История пуста',
  favoritesEmpty: 'Избранное пусто',
  addFavorite: 'Добавить в избранное',
  removeFavorite: 'Убрать из избранного',
  feedbackTitle: 'Заголовок',
  feedbackMessage: 'Сообщение',
  feedbackEmail: 'Почта',
  saveSuccess: 'Сохранено.',
  saveShort: 'Сохранено',
  noSubject: 'Без темы',
  emptyMessage: 'Сообщение пока пустое.',
  feedbackPageTitle: 'Обратная связь'
}

export async function buildMessages(language) {
  const entries = await Promise.all(
    Object.entries(UI_MESSAGES).map(async ([key, value]) => [key, await translateUiMessage(value, language)])
  )

  return Object.fromEntries(entries)
}
