<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useGameLoop } from '../composables/useGameLoop'
import { useMinigameResult, type MinigameResult } from '../composables/useMinigameResult'
import { ParticleSystem } from '../engine/particles'
import { ScreenShake } from '../engine/screenShake'
import { attachPointer } from '../engine/inputPointer'
import { sfx } from '../engine/soundManager'
import { formatNumber } from '../engine/numberFormat'

type Phase = 'ready' | 'showing' | 'input' | 'over'

const GRID = 3
const TILE_COLORS = ['#38d6ff', '#ff4dd8', '#8b7bff', '#3dffa0', '#ffc83d', '#38b6ff', '#b45bff', '#4ade80', '#ff8a5b']

const canvasEl = ref<HTMLCanvasElement | null>(null)
const round = ref(0)
const phase = ref<Phase>('ready')
const lastReward = ref<MinigameResult | null>(null)
const statusText = ref('')

const { reportResult } = useMinigameResult()

const particles = new ParticleSystem()
const shake = new ScreenShake()
// set once in onMounted before any interaction can reach tileRect/game loop
let ctx: CanvasRenderingContext2D | null = null
let sequence: number[] = []
let inputIndex = 0
let tileFlash = new Array(GRID * GRID).fill(0) // 0..1 glow per tile
let timeouts: ReturnType<typeof setTimeout>[] = []

function later(fn: () => void, ms: number) {
  timeouts.push(setTimeout(fn, ms))
}

function clearTimers() {
  timeouts.forEach(clearTimeout)
  timeouts = []
}

function tileRect(i: number) {
  const { width, height } = ctx!.canvas
  const size = Math.min(width, height)
  const pad = size * 0.06
  const cell = (size - pad * 2) / GRID
  const ox = (width - size) / 2 + pad
  const oy = (height - size) / 2 + pad
  const col = i % GRID
  const row = (i / GRID) | 0
  return { x: ox + col * cell + cell * 0.06, y: oy + row * cell + cell * 0.06, s: cell * 0.88 }
}

function playSequence() {
  phase.value = 'showing'
  statusText.value = 'WATCH'
  inputIndex = 0
  const stepMs = Math.max(650 - round.value * 25, 300)
  sequence.forEach((tile, i) => {
    later(() => {
      tileFlash[tile] = 1
      sfx.chime(tile % 8)
    }, 500 + i * stepMs)
  })
  later(() => {
    phase.value = 'input'
    statusText.value = 'REPEAT'
  }, 500 + sequence.length * stepMs)
}

function nextRound() {
  round.value++
  sequence.push((Math.random() * GRID * GRID) | 0)
  playSequence()
}

function tapTile(i: number) {
  if (phase.value !== 'input') return
  tileFlash[i] = 1
  const rect = tileRect(i)

  if (i === sequence[inputIndex]) {
    sfx.chime(inputIndex % 8)
    particles.burst(rect.x + rect.s / 2, rect.y + rect.s / 2, {
      colors: [TILE_COLORS[i]],
      count: 8,
      speed: 120,
      gravity: 0,
    })
    inputIndex++
    if (inputIndex >= sequence.length) {
      // round cleared
      statusText.value = 'CLEAR'
      shake.shake(4, 0.2)
      const { width, height } = ctx!.canvas
      particles.burst(width / 2, height / 2, {
        colors: TILE_COLORS,
        count: 20 + round.value * 3,
        speed: 260,
        gravity: 120,
      })
      later(nextRound, 900)
    }
  } else {
    sfx.error()
    shake.shake(12, 0.4)
    endGame()
  }
}

function startGame() {
  clearTimers()
  sequence = []
  round.value = 0
  lastReward.value = null
  tileFlash.fill(0)
  nextRound()
}

function endGame() {
  phase.value = 'over'
  const survived = Math.max(round.value - 1, 0)
  lastReward.value = reportResult({
    gameId: 'pattern-match',
    score: survived,
    stats: {},
  })
}

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth, 440)
  ctx = canvas.getContext('2d')

  attachPointer(canvas, {
    onDown: ({ x, y }) => {
      for (let i = 0; i < GRID * GRID; i++) {
        const r = tileRect(i)
        if (x >= r.x && x <= r.x + r.s && y >= r.y && y <= r.y + r.s) {
          tapTile(i)
          return
        }
      }
    },
  })
})

onUnmounted(clearTimers)

useGameLoop((dt) => {
  if (!ctx) return
  const ctx2d = ctx
  const { width, height } = ctx2d.canvas

  for (let i = 0; i < tileFlash.length; i++) {
    tileFlash[i] = Math.max(tileFlash[i] - dt * 2.4, 0)
  }
  particles.update(dt)
  shake.update(dt)

  ctx2d.clearRect(0, 0, width, height)
  ctx2d.save()
  ctx2d.translate(shake.x, shake.y)

  for (let i = 0; i < GRID * GRID; i++) {
    const { x, y, s } = tileRect(i)
    const flash = tileFlash[i]
    const color = TILE_COLORS[i]
    ctx2d.beginPath()
    ctx2d.roundRect(x, y, s, s, s * 0.16)
    ctx2d.fillStyle = flash > 0.05 ? color + Math.floor(40 + flash * 180).toString(16).padStart(2, '0') : 'rgba(140, 180, 255, 0.06)'
    ctx2d.fill()
    ctx2d.lineWidth = 2
    ctx2d.strokeStyle = flash > 0.05 ? color : 'rgba(140, 180, 255, 0.18)'
    ctx2d.shadowColor = color
    ctx2d.shadowBlur = flash * 34
    ctx2d.stroke()
    ctx2d.shadowBlur = 0
  }

  particles.render(ctx2d)
  ctx2d.restore()
})
</script>

<template>
  <div class="game">
    <div class="stat-bar">
      <div class="stat">
        <span class="stat-label">ROUND</span>
        <span class="stat-value num">{{ round }}</span>
      </div>
      <div class="stat">
        <span class="status" :class="{ input: phase === 'input' }">{{ statusText || '·' }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">LENGTH</span>
        <span class="stat-value num">{{ round }}</span>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasEl" class="game-canvas glass"></canvas>

      <div v-if="phase === 'ready'" class="overlay">
        <h3>PATTERN MATCH</h3>
        <p>Watch the sequence. Repeat it.<br />Every round adds a step. Rewards grow fast.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>PATTERN BROKEN</h3>
        <p class="final num">Round {{ Math.max(round - 1, 0) }}</p>
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
.status {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.2em;
  color: var(--text-dim);
  transition: color var(--dur-fast);
}

.status.input {
  color: var(--success);
  text-shadow: var(--glow-sm) rgba(61, 255, 160, 0.5);
}
</style>
