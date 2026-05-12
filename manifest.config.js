import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Local Translator',
  description: 'Минималистичное Chrome-расширение для локального перевода через Chrome Built-in AI Translator API.',
  version: pkg.version,
  icons: {
    16: 'public/logo.png',
    32: 'public/logo.png',
    48: 'public/logo.png',
    128: 'public/logo.png',
  },
  action: {
    default_icon: {
      16: 'public/logo.png',
      32: 'public/logo.png',
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
    default_title: 'Local Translator',
  },
  background: {
    service_worker: 'src/background/main.js',
  },
  commands: {
    'invoke-translation': {
      suggested_key: {
        default: 'Alt+Shift+S',
      },
      description: 'Open translation for selected text',
    },
  },
  content_scripts: [
    {
      js: ['src/content/main.js'],
      matches: ['<all_urls>'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['public/logo.png'],
      matches: ['<all_urls>'],
    },
  ],
  options_page: 'src/options/index.html',
  permissions: [
    'storage',
    'tabs',
  ],
  host_permissions: ['<all_urls>'],
})
