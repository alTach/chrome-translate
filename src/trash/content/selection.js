import { normalizeLineEndings, extractFormattedTextFromRange } from '@/trash/text.js'

const TEXT_INPUT_TYPES = ['text', 'search', 'url', 'tel', 'email', 'password']

export function isTextInputElement(element) {
  if (!element) {
    return false
  }

  if (element.tagName === 'TEXTAREA') {
    return true
  }

  if (element.tagName !== 'INPUT') {
    return false
  }

  const type = element.getAttribute('type') || 'text'
  return TEXT_INPUT_TYPES.includes(type)
}

export function getInputSelectionText(element) {
  const start = element.selectionStart
  const end = element.selectionEnd

  if (start == null || end == null || start === end) {
    return ''
  }

  return element.value.substring(start, end).trim()
}

export function isEditable(element) {
  if (!element) {
    return false
  }

  return Boolean(
    element.closest('input, textarea, [contenteditable=""], [contenteditable="true"]')
  )
}

export function getSelectionAnchorPoint(selection, rect) {
  if (!selection || selection.rangeCount === 0) {
    return { x: rect.right, y: rect.bottom }
  }

  const range = selection.getRangeAt(0)
  const endNode = range.endContainer
  const endOffset = range.endOffset

  try {
    if (endNode?.nodeType === Node.TEXT_NODE) {
      const probe = document.createRange()
      const startOffset = Math.max(0, endOffset - 1)
      probe.setStart(endNode, startOffset)
      probe.setEnd(endNode, endOffset)
      const probeRect = probe.getBoundingClientRect()

      if (probeRect && (probeRect.width || probeRect.height)) {
        return { x: probeRect.right, y: probeRect.bottom }
      }
    } else if (endNode?.childNodes?.length) {
      const childIndex = Math.max(0, Math.min(endOffset - 1, endNode.childNodes.length - 1))
      const childNode = endNode.childNodes[childIndex]

      if (childNode) {
        const probe = document.createRange()
        probe.selectNodeContents(childNode)
        const probeRect = probe.getBoundingClientRect()

        if (probeRect && (probeRect.width || probeRect.height)) {
          return { x: probeRect.right, y: probeRect.bottom }
        }
      }
    }
  } catch {
    return { x: rect.right, y: rect.bottom }
  }

  return { x: rect.right, y: rect.bottom }
}

export function getSelectedTextAndRect() {
  const activeElement = document.activeElement

  if (isTextInputElement(activeElement)) {
    const text = normalizeLineEndings(getInputSelectionText(activeElement))

    if (!text) {
      return null
    }

    const rect = activeElement.getBoundingClientRect()

    if (!rect.width && !rect.height) {
      return null
    }

    return {
      text,
      rect,
      range: null,
      anchor: null
    }
  }

  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null
  }

  const range = selection.getRangeAt(0)
  const formattedText = extractFormattedTextFromRange(range)

  if (!formattedText.trim()) {
    return null
  }

  const rect = range.getBoundingClientRect()

  if (!rect || (!rect.width && !rect.height)) {
    return null
  }

  return {
    text: formattedText,
    rect,
    range: range.cloneRange(),
    anchor: getSelectionAnchorPoint(selection, rect)
  }
}

export function getRangeRect(range, fallbackRect) {
  if (!range) {
    return fallbackRect
  }

  try {
    const nextRect = range.getBoundingClientRect()

    if (nextRect && (nextRect.width || nextRect.height)) {
      return nextRect
    }
  } catch {
    return fallbackRect
  }

  return fallbackRect
}
