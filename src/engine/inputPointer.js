/**
 * Normalizes mouse/touch/pen events on a canvas into canvas-space
 * coordinates, accounting for CSS scaling and devicePixelRatio-free
 * logical coordinates.
 */
export function attachPointer(canvas, handlers = {}) {
  const toLocal = (e) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      id: e.pointerId,
    }
  }

  const onDown = (e) => {
    canvas.setPointerCapture?.(e.pointerId)
    handlers.onDown?.(toLocal(e))
  }
  const onMove = (e) => handlers.onMove?.(toLocal(e))
  const onUp = (e) => handlers.onUp?.(toLocal(e))

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.style.touchAction = 'none'

  return () => {
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
  }
}
