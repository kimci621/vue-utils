export function isTouchDevice() {
  if (!import.meta.client) {
    return false
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
