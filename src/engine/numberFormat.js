/**
 * Big-number formatting (1.2K / 3.4M / 2.1B) and count-up animation.
 */

const UNITS = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
]

export function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return '0'
  const neg = n < 0
  const abs = Math.abs(n)
  for (const { value, suffix } of UNITS) {
    if (abs >= value) {
      const scaled = abs / value
      const str = scaled >= 100 ? Math.floor(scaled).toString() : scaled.toFixed(1).replace(/\.0$/, '')
      return (neg ? '-' : '') + str + suffix
    }
  }
  return (neg ? '-' : '') + Math.floor(abs).toString()
}

/**
 * Animates a numeric value from -> to, invoking onUpdate with the
 * current value each frame. Returns a cancel function.
 * Standalone rAF so it works outside any GameLoop (HUD, toasts).
 */
export function countUp(from, to, { duration = 0.8, onUpdate, onComplete } = {}) {
  const start = performance.now()
  let rafId = 0
  const frame = (now) => {
    const p = Math.min((now - start) / (duration * 1000), 1)
    // easeOutQuint — fast start, satisfying settle
    const eased = 1 - Math.pow(1 - p, 5)
    onUpdate?.(from + (to - from) * eased)
    if (p < 1) {
      rafId = requestAnimationFrame(frame)
    } else {
      onComplete?.()
    }
  }
  rafId = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(rafId)
}
