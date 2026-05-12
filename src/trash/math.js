export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function getViewportSize(margin = 16) {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    margin
  }
}
