/**
 * Easing functions + a tiny tween runner.
 * Used for gacha reveals, count-ups, UI pops — anything that
 * needs spring/overshoot feel beyond CSS transitions.
 */

export type Easing = (t: number) => number

export const easings: Record<string, Easing> = {
  linear: (t) => t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
  easeInCubic: (t) => t * t * t,
  easeOutBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t
    const c4 = (2 * Math.PI) / 3
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
}

export interface TweenConfig {
  from?: number
  to?: number
  duration?: number
  easing?: Easing
  delay?: number
  onUpdate?: (value: number, progress: number) => void
  onComplete?: () => void
}

/**
 * A single tween. Call update(dt) each frame; returns false when done.
 */
export class Tween {
  from: number
  to: number
  duration: number
  easing: Easing
  delay: number
  onUpdate?: (value: number, progress: number) => void
  onComplete?: () => void
  elapsed = 0
  done = false

  constructor({ from = 0, to = 1, duration = 0.3, easing = easings.easeOutCubic, delay = 0, onUpdate, onComplete }: TweenConfig) {
    this.from = from
    this.to = to
    this.duration = duration
    this.easing = easing
    this.delay = delay
    this.onUpdate = onUpdate
    this.onComplete = onComplete
  }

  update(dt: number): boolean {
    if (this.done) return false
    this.elapsed += dt
    const t = this.elapsed - this.delay
    if (t < 0) return true
    const p = Math.min(t / this.duration, 1)
    const v = this.from + (this.to - this.from) * this.easing(p)
    this.onUpdate?.(v, p)
    if (p >= 1) {
      this.done = true
      this.onComplete?.()
      return false
    }
    return true
  }
}

/**
 * Runs a set of tweens; call update(dt) once per frame from a GameLoop.
 */
export class TweenGroup {
  tweens: Tween[] = []

  add(config: TweenConfig | Tween): Tween {
    const tween = config instanceof Tween ? config : new Tween(config)
    this.tweens.push(tween)
    return tween
  }

  update(dt: number) {
    this.tweens = this.tweens.filter((t) => t.update(dt))
  }

  clear() {
    this.tweens = []
  }

  get active() {
    return this.tweens.length > 0
  }
}
