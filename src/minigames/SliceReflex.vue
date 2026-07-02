<script setup>
import { onMounted, ref } from 'vue'
import { useGameLoop } from '../composables/useGameLoop'
import { useMinigameResult } from '../composables/useMinigameResult'
import { ParticleSystem } from '../engine/particles'
import { ScreenShake } from '../engine/screenShake'
import { attachPointer } from '../engine/inputPointer'
import { sfx } from '../engine/soundManager'
import { formatNumber } from '../engine/numberFormat'

const GAME_LENGTH = 60
const COLORS = ['#38d6ff', '#ff4dd8', '#8b7bff', '#3dffa0']

const canvasEl = ref(null)
const score = ref(0)
const timeLeft = ref(GAME_LENGTH)
const combo = ref(0)
const phase = ref('ready')
const lastReward = ref(null)

const { reportResult } = useMinigameResult()

const particles = new ParticleSystem()
const shake = new ScreenShake()
let ctx = null
let objects = [] // { x, y, vx, vy, r, color, bomb, sliced }
let trail = [] // recent pointer points { x, y, t }
let spawnTimer = 0
let elapsed = 0
let multiSlices = 0
let slicing = false

function spawnWave(width, height) {
  const n = 1 + Math.floor(elapsed / 15) + (Math.random() < 0.3 ? 1 : 0)
  for (let i = 0; i < n; i++) {
    const bomb = Math.random() < 0.12
    const x = width * (0.15 + Math.random() * 0.7)
    objects.push({
      x,
      y: height + 30,
      vx: (width / 2 - x) * (0.4 + Math.random() * 0.5) / 100 * 60,
      vy: -(height * 1.15 + Math.random() * height * 0.25),
      r: bomb ? 20 : 18 + Math.random() * 12,
      color: bomb ? '#ff5470' : COLORS[(Math.random() * COLORS.length) | 0],
      bomb,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 4,
    })
  }
}

function sliceAt(prev, curr) {
  let hits = 0
  for (const o of objects) {
    if (o.sliced) continue
    // segment-circle distance
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const len2 = dx * dx + dy * dy || 1
    let t = ((o.x - prev.x) * dx + (o.y - prev.y) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const cx = prev.x + t * dx - o.x
    const cy = prev.y + t * dy - o.y
    if (cx * cx + cy * cy < o.r * o.r) {
      o.sliced = true
      if (o.bomb) {
        combo.value = 0
        score.value = Math.max(score.value - 15, 0)
        shake.shake(16, 0.5)
        sfx.thud()
        particles.burst(o.x, o.y, { colors: ['#ff5470', '#ffaa00'], count: 40, speed: 340, size: 6 })
      } else {
        hits++
        particles.burst(o.x, o.y, { colors: [o.color], count: 16, speed: 240, shape: 'square' })
        sfx.pop(0.9 + hits * 0.15)
      }
    }
  }
  if (hits > 0) {
    combo.value = Math.min(combo.value + hits, 30)
    score.value += hits * (1 + combo.value * 0.2) * 5
    score.value = Math.floor(score.value)
    if (hits >= 3) {
      multiSlices++
      shake.shake(8, 0.3)
      sfx.fanfare()
    }
  }
  objects = objects.filter((o) => !o.sliced)
}

function startGame() {
  objects = []
  trail = []
  score.value = 0
  combo.value = 0
  multiSlices = 0
  elapsed = 0
  timeLeft.value = GAME_LENGTH
  lastReward.value = null
  phase.value = 'playing'
}

function endGame() {
  phase.value = 'over'
  lastReward.value = reportResult({
    gameId: 'slice-reflex',
    score: score.value,
    stats: { multiSlices },
  })
}

onMounted(() => {
  const canvas = canvasEl.value
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth * 1.2, 520)
  ctx = canvas.getContext('2d')

  attachPointer(canvas, {
    onDown: (p) => {
      slicing = true
      trail = [{ ...p, t: performance.now() }]
    },
    onMove: (p) => {
      if (!slicing || phase.value !== 'playing') return
      const prev = trail[trail.length - 1]
      trail.push({ ...p, t: performance.now() })
      if (trail.length > 24) trail.shift()
      if (prev) sliceAt(prev, p)
    },
    onUp: () => {
      slicing = false
      combo.value = 0 // combo lives within one continuous swipe
    },
  })
})

useGameLoop((dt) => {
  if (!ctx) return
  const { width, height } = ctx.canvas

  if (phase.value === 'playing') {
    elapsed += dt
    timeLeft.value = Math.max(GAME_LENGTH - elapsed, 0)
    if (timeLeft.value <= 0) {
      endGame()
    }

    spawnTimer -= dt
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(1.6 - elapsed * 0.015, 0.7)
      spawnWave(width, height)
    }

    const g = height * 1.1
    for (const o of objects) {
      o.vy += g * dt
      o.x += o.vx * dt
      o.y += o.vy * dt
      o.rotation += o.spin * dt
    }
    objects = objects.filter((o) => o.y < height + 80)
  }

  particles.update(dt)
  shake.update(dt)

  // prune old trail points so the streak fades even when idle
  const now = performance.now()
  trail = trail.filter((p) => now - p.t < 180)

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(shake.x, shake.y)

  // objects
  for (const o of objects) {
    ctx.save()
    ctx.translate(o.x, o.y)
    ctx.rotate(o.rotation)
    if (o.bomb) {
      ctx.beginPath()
      ctx.arc(0, 0, o.r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 84, 112, 0.25)'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = o.color
      ctx.shadowColor = o.color
      ctx.shadowBlur = 14
      ctx.stroke()
      ctx.shadowBlur = 0
      // spikes
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * o.r, Math.sin(a) * o.r)
        ctx.lineTo(Math.cos(a) * (o.r + 8), Math.sin(a) * (o.r + 8))
        ctx.stroke()
      }
    } else {
      // hexagonal shard
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const px = Math.cos(a) * o.r
        const py = Math.sin(a) * o.r
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fillStyle = o.color + '2e'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = o.color
      ctx.shadowColor = o.color
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    ctx.restore()
  }

  // slice trail
  if (trail.length > 1) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let i = 1; i < trail.length; i++) {
      const age = (now - trail[i].t) / 180
      ctx.beginPath()
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
      ctx.lineTo(trail[i].x, trail[i].y)
      ctx.lineWidth = (1 - age) * 8
      ctx.strokeStyle = `rgba(232, 238, 252, ${(1 - age) * 0.9})`
      ctx.shadowColor = '#38d6ff'
      ctx.shadowBlur = 12
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }

  particles.render(ctx)
  ctx.restore()
})
</script>

<template>
  <div class="game">
    <div class="stat-bar">
      <div class="stat">
        <span class="stat-label">SCORE</span>
        <span class="stat-value num">{{ formatNumber(score) }}</span>
      </div>
      <div class="stat combo" :class="{ hot: combo >= 5 }">
        <span class="stat-label">CHAIN</span>
        <span class="stat-value num">×{{ combo }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">TIME</span>
        <span class="stat-value num">{{ Math.ceil(timeLeft) }}</span>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasEl" class="game-canvas glass"></canvas>

      <div v-if="phase === 'ready'" class="overlay">
        <h3>SLICE REFLEX</h3>
        <p>Swipe through shards before they fall.<br />3+ in one stroke = Core bonus. Avoid the red mines.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>BLADE COOLED</h3>
        <p class="final num">{{ formatNumber(score) }} pts</p>
        <p v-if="lastReward" class="reward">
          <span class="shards-text num">+{{ formatNumber(lastReward.shards) }} Shards</span>
          <span v-if="lastReward.cores" class="cores-text num"> +{{ lastReward.cores }} Cores</span>
        </p>
        <button class="cta" @click="startGame">PLAY AGAIN</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.combo .stat-value {
  transition: all var(--dur-fast);
}

.combo.hot .stat-value {
  color: var(--success);
  text-shadow: var(--glow-sm) rgba(61, 255, 160, 0.5);
  transform: scale(1.15);
}
</style>
