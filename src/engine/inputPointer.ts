/**
 * Normalizes mouse/touch/pen events on a canvas into canvas-space
 * coordinates, accounting for CSS scaling and devicePixelRatio-free
 * logical coordinates.
 */
export interface LocalPoint {
  x: number
  y: number
  id: number
}

export interface PointerHandlers {
  onDown?: (p: LocalPoint) => void
  onMove?: (p: LocalPoint) => void
  onUp?: (p: LocalPoint) => void
}

export function attachPointer(canvas: HTMLCanvasElement, handlers: PointerHandlers = {}) {
  const toLocal = (e: PointerEvent): LocalPoint => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      id: e.pointerId,
    }
  }

  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture?.(e.pointerId)
    handlers.onDown?.(toLocal(e))
  }
  const onMove = (e: PointerEvent) => handlers.onMove?.(toLocal(e))
  const onUp = (e: PointerEvent) => handlers.onUp?.(toLocal(e))

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
