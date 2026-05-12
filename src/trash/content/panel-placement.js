import { PANEL_DEFAULTS } from '@/trash/app/constants.js'
import { clamp } from '@/trash/math.js'
import { OFFSET, TRIGGER_SIZE, VIEWPORT_EDGE_MARGIN } from '@/trash/content/constants.js'

/**
 * @param {{x:number,y:number}} anchor
 * @param {{width:number,height:number}} panelSize
 */
export function computePanelPlacementNearAnchor(anchor, panelSize) {
  const width = panelSize.width || PANEL_DEFAULTS.width
  const height = panelSize.height || PANEL_DEFAULTS.height
  const margin = VIEWPORT_EDGE_MARGIN
  const gap = OFFSET

  let left = anchor.x + gap
  let top = anchor.y + gap

  if (top + height > window.innerHeight - margin) {
    top = anchor.y - height - gap
  }

  if (left + width > window.innerWidth - margin) {
    left = anchor.x - width - gap
  }

  return {
    left: clamp(left, margin, window.innerWidth - width - margin),
    top: clamp(top, margin, window.innerHeight - height - margin)
  }
}

/**
 * @param {{left:number,top:number}} placement
 * @param {{width:number,height:number}} panelSize
 */
export function clampPanelPlacement(placement, panelSize) {
  return {
    left: clamp(
      placement.left,
      VIEWPORT_EDGE_MARGIN,
      window.innerWidth - panelSize.width - VIEWPORT_EDGE_MARGIN
    ),
    top: clamp(
      placement.top,
      VIEWPORT_EDGE_MARGIN,
      window.innerHeight - panelSize.height - VIEWPORT_EDGE_MARGIN
    )
  }
}

/**
 * @param {{x:number,y:number}} anchor
 */
export function computeTriggerPlacement(anchor) {
  return {
    left: clamp(
      anchor.x - 15,
      VIEWPORT_EDGE_MARGIN,
      window.innerWidth - TRIGGER_SIZE - VIEWPORT_EDGE_MARGIN
    ),
    top: clamp(
      anchor.y + OFFSET,
      VIEWPORT_EDGE_MARGIN,
      window.innerHeight - TRIGGER_SIZE - VIEWPORT_EDGE_MARGIN
    )
  }
}

export function computePanelPlacementFromPoint(x, y, panelWidth, panelHeight) {
  return {
    left: clamp(x, VIEWPORT_EDGE_MARGIN, window.innerWidth - panelWidth - VIEWPORT_EDGE_MARGIN),
    top: clamp(y, VIEWPORT_EDGE_MARGIN, window.innerHeight - panelHeight - VIEWPORT_EDGE_MARGIN)
  }
}
