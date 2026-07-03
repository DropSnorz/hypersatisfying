/**
 * Screen shake as a per-frame {x, y} offset.
 * Canvas games apply it via ctx.translate(); DOM layers via
 * a transform on a wrapper element.
 */
export class ScreenShake {
  intensity = 0
  duration = 0
  elapsed = 0
  x = 0
  y = 0

  /**
   * @param intensity max pixel offset
   * @param duration seconds
   */
  shake(intensity = 8, duration = 0.3) {
    // stack: keep the stronger of current vs new
    if (intensity >= this.intensity || this.elapsed >= this.duration) {
      this.intensity = intensity
      this.duration = duration
      this.elapsed = 0
    }
  }

  update(dt: number) {
    if (this.elapsed >= this.duration) {
      this.x = 0
      this.y = 0
      return
    }
    this.elapsed += dt
    const falloff = 1 - this.elapsed / this.duration
    const amp = this.intensity * falloff * falloff
    this.x = (Math.random() - 0.5) * 2 * amp
    this.y = (Math.random() - 0.5) * 2 * amp
  }

  get active() {
    return this.elapsed < this.duration
  }
}
