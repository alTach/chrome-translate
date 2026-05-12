import { PANEL_DEFAULTS } from '@/trash/app/constants.js'
import { clamp } from '@/trash/math.js'
import { countWords } from '@/trash/text.js'
import {
  PANEL_SIZE_COMPACT,
  PANEL_SIZE_LARGE,
  PANEL_WORD_THRESHOLD,
  VIEWPORT_RESIZE_MARGIN
} from '@/trash/content/constants.js'

export function computePanelSize(sourceText, resultText = '') {
  const wordCount = Math.max(countWords(sourceText), countWords(resultText))
  const preset = wordCount <= PANEL_WORD_THRESHOLD ? PANEL_SIZE_COMPACT : PANEL_SIZE_LARGE

  return {
    width: clamp(
      preset.width,
      PANEL_DEFAULTS.minWidth,
      window.innerWidth - VIEWPORT_RESIZE_MARGIN * 2
    ),
    height: clamp(
      preset.height,
      PANEL_DEFAULTS.minHeight,
      window.innerHeight - VIEWPORT_RESIZE_MARGIN * 2
    )
  }
}

export function computeResizedPanelSize({
  startWidth,
  startHeight,
  startX,
  startY,
  clientX,
  clientY
}) {
  return {
    width: clamp(
      startWidth + (clientX - startX),
      PANEL_DEFAULTS.minWidth,
      window.innerWidth - VIEWPORT_RESIZE_MARGIN
    ),
    height: clamp(
      startHeight + (clientY - startY),
      PANEL_DEFAULTS.minHeight,
      window.innerHeight - VIEWPORT_RESIZE_MARGIN
    )
  }
}
