/**
 * requestAnimationFrame wrapper with delta time.
 * Auto-pauses while the tab is hidden so dt never explodes
 * after a background stint.
 */
export class GameLoop {
  constructor(callback) {
    this.callback = callback
    this.running = false
    this.paused = false
    this._rafId = 0
    this._lastTime = 0
    this._onVisibility = () => {
      if (document.hidden) this._lastTime = 0
    }
  }

  start() {
    if (this.running) return
    this.running = true
    this.paused = false
    this._lastTime = 0
    document.addEventListener('visibilitychange', this._onVisibility)
    const tick = (time) => {
      if (!this.running) return
      this._rafId = requestAnimationFrame(tick)
      if (this.paused) return
      if (this._lastTime === 0) {
        this._lastTime = time
        return
      }
      // clamp dt to 100ms so long frames can't tunnel physics
      const dt = Math.min((time - this._lastTime) / 1000, 0.1)
      this._lastTime = time
      this.callback(dt, time / 1000)
    }
    this._rafId = requestAnimationFrame(tick)
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
    this._lastTime = 0
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this._rafId)
    document.removeEventListener('visibilitychange', this._onVisibility)
  }
}
