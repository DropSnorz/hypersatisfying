/**
 * Pooled canvas particle system for bursts, confetti, and trails.
 * Pooling avoids GC churn during rapid-fire pops.
 */

const POOL_SIZE = 600

function makeParticle() {
  return {
    active: false,
    x: 0, y: 0,
    vx: 0, vy: 0,
    life: 0, maxLife: 1,
    size: 4,
    color: '#fff',
    gravity: 0,
    drag: 1,
    shape: 'circle', // 'circle' | 'square' | 'spark'
    rotation: 0,
    spin: 0,
  }
}

export class ParticleSystem {
  constructor() {
    this.pool = Array.from({ length: POOL_SIZE }, makeParticle)
    this._cursor = 0
  }

  _next() {
    // linear scan from cursor; recycles oldest when saturated
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[(this._cursor + i) % POOL_SIZE]
      if (!p.active) {
        this._cursor = (this._cursor + i + 1) % POOL_SIZE
        return p
      }
    }
    const p = this.pool[this._cursor]
    this._cursor = (this._cursor + 1) % POOL_SIZE
    return p
  }

  /**
   * Radial burst — the bread-and-butter pop effect.
   */
  burst(x, y, {
    count = 12,
    colors = ['#38d6ff'],
    speed = 180,
    speedVariance = 0.5,
    size = 5,
    sizeVariance = 0.5,
    life = 0.6,
    gravity = 300,
    drag = 0.92,
    shape = 'circle',
  } = {}) {
    for (let i = 0; i < count; i++) {
      const p = this._next()
      const angle = Math.random() * Math.PI * 2
      const spd = speed * (1 - speedVariance + Math.random() * speedVariance * 2)
      p.active = true
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * spd
      p.vy = Math.sin(angle) * spd
      p.maxLife = life * (0.6 + Math.random() * 0.8)
      p.life = p.maxLife
      p.size = size * (1 - sizeVariance + Math.random() * sizeVariance * 2)
      p.color = colors[(Math.random() * colors.length) | 0]
      p.gravity = gravity
      p.drag = drag
      p.shape = shape
      p.rotation = Math.random() * Math.PI * 2
      p.spin = (Math.random() - 0.5) * 12
    }
  }

  /**
   * Confetti rain from a point — celebration moments.
   */
  confetti(x, y, { count = 40, colors = ['#38d6ff', '#ff4dd8', '#ffc83d', '#3dffa0'] } = {}) {
    this.burst(x, y, {
      count,
      colors,
      speed: 320,
      speedVariance: 0.6,
      size: 6,
      life: 1.4,
      gravity: 420,
      drag: 0.96,
      shape: 'square',
    })
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }
      p.vy += p.gravity * dt
      p.vx *= p.drag
      p.vy *= p.drag
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rotation += p.spin * dt
    }
  }

  render(ctx) {
    for (const p of this.pool) {
      if (!p.active) continue
      const alpha = Math.min(p.life / p.maxLife, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else if (p.shape === 'spark') {
        ctx.fillRect(-p.size, -p.size * 0.15, p.size * 2, p.size * 0.3)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  get activeCount() {
    let n = 0
    for (const p of this.pool) if (p.active) n++
    return n
  }
}
