export function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export function countWords(text) {
  const normalized = normalizeLineEndings(text).trim()

  if (!normalized) {
    return 0
  }

  return normalized.split(/\s+/).filter(Boolean).length
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'TR',
  'SECTION',
  'ARTICLE',
  'BLOCKQUOTE',
  'PRE'
])

export function extractFormattedTextFromRange(range) {
  const container = document.createElement('div')
  container.append(range.cloneContents())

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const element = /** @type {HTMLElement} */ (node)

    if (element.tagName === 'BR') {
      return '\n'
    }

    let value = ''

    for (const child of element.childNodes) {
      value += walk(child)
    }

    if (BLOCK_TAGS.has(element.tagName)) {
      const trimmed = value.replace(/\n+$/, '')
      return `${trimmed}\n\n`
    }

    return value
  }

  const extracted = walk(container)

  if (extracted.trim()) {
    return normalizeLineEndings(extracted).replace(/\n{3,}/g, '\n\n').trimEnd()
  }

  const fallback = container.innerText || container.textContent || ''
  return normalizeLineEndings(fallback).trimEnd()
}
