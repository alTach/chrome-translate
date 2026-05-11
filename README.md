# Local Translator

Минималистичное Chrome-расширение на `Svelte 5` и `Tailwind CSS 4` для локального перевода через `Chrome Built-in AI Translator API`.

Проект собирается как полностью статический `MPA` через `Vite`: на выходе получаются готовые `html/js/css` файлы без сервера и без SSR. Для этого в конфиге включены `appType: 'mpa'` и относительный `base`.

## Что внутри

- popup с локальным переводом и отдельным экраном результата
- индикатор загрузки модели под полем ввода
- история последних 5 переводов
- страница настроек с выбором языка и локальной формой обратной связи
- локальное хранение через `chrome.storage`

## Требования

- `Chrome 138+`
- только desktop Chrome
- при первом переводе Chrome может скачать языковые модели локально

## Запуск

```bash
npm install
npm run build
```

## Загрузка в Chrome

1. Откройте `chrome://extensions`
2. Включите `Developer mode`
3. Нажмите `Load unpacked`
4. Выберите папку `dist`

## Структура

- `src/popup` — popup расширения
- `src/options` — страница настроек
- `src/lib` — хранение, API и общие компоненты
- `public/manifest.json` — manifest Chrome Extension
