<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameLoop } from '../composables/useGameLoop'
import { useMinigameResult, type MinigameResult } from '../composables/useMinigameResult'
import { ParticleSystem } from '../engine/particles'
import { ScreenShake } from '../engine/screenShake'
import { attachPointer } from '../engine/inputPointer'
import { sfx } from '../engine/soundManager'
import { formatNumber } from '../engine/numberFormat'

interface Bubble {
  x: number
  y: number
  r: number
  targetR: number
  color: string
  golden: boolean
  vy: number
  wobblePhase: number
  squish: number
}

type Phase = 'ready' | 'playing' | 'over'

const GAME_LENGTH = 45
const COLORS = ['#38d6ff', '#ff4dd8', '#8b7bff', '#3dffa0', '#ffc83d']
const GOLD = '#ffe28a'
const CHAIN_RADIUS = 78

const canvasEl = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const timeLeft = ref(GAME_LENGTH)
const combo = ref(0)
const phase = ref<Phase>('ready')
const lastReward = ref<MinigameResult | null>(null)

const { reportResult } = useMinigameResult()

// --- non-reactive game state (never touched by Vue reactivity) ---
const particles = new ParticleSystem()
const shake = new ScreenShake()
let ctx: CanvasRenderingContext2D | null = null
let bubbles: Bubble[] = []
let spawnTimer = 0
let comboTimer = 0
let goldenPops = 0
let elapsed = 0

function spawnBubble(width: number, height: number, golden = false) {
  const r = golden ? 20 : 16 + Math.random() * 14
  bubbles.push({
    x: r + Math.random() * (width - r * 2),
    y: height + r,
    r,
    targetR: r,
    color: golden ? GOLD : COLORS[(Math.random() * COLORS.length) | 0],
    golden,
    vy: -(24 + Math.random() * 30),
    wobblePhase: Math.random() * Math.PI * 2,
    squish: 1,
  })
}

function popChain(hit: Bubble) {
  // flood-fill same-color bubbles within chain radius of each popped one
  const chain = [hit]
  const seen = new Set([hit])
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i]
    for (const other of bubbles) {
      if (seen.has(other) || other.color !== b.color) continue
      const dx = other.x - b.x
      const dy = other.y - b.y
      if (dx * dx + dy * dy < CHAIN_RADIUS * CHAIN_RADIUS) {
        seen.add(other)
        chain.push(other)
      }
    }
  }

  combo.value = Math.min(combo.value + 1, 20)
  comboTimer = 2 // seconds to keep the combo alive
  const gained = chain.length * (1 + combo.value * 0.25)
  score.value += Math.floor(gained)

  chain.forEach((b, i) => {
    setTimeout(() => {
      particles.burst(b.x, b.y, {
        colors: [b.color],
        count: b.golden ? 34 : 12,
        speed: b.golden ? 300 : 170,
        size: b.r / 3.2,
      })
      sfx.pop(0.8 + i * 0.08)
    }, i * 55)
    if (b.golden) {
      goldenPops++
      shake.shake(12, 0.4)
      sfx.fanfare()
    }
  })
  if (chain.length >= 4) shake.shake(5 + chain.length, 0.25)

  bubbles = bubbles.filter((b) => !seen.has(b))
}

function startGame() {
  const canvas = canvasEl.value
  if (!canvas) return
  bubbles = []
  score.value = 0
  combo.value = 0
  goldenPops = 0
  elapsed = 0
  timeLeft.value = GAME_LENGTH
  lastReward.value = null
  // seed the field
  for (let i = 0; i < 14; i++) {
    spawnBubble(canvas.width, canvas.height)
    bubbles[bubbles.length - 1].y = Math.random() * canvas.height
  }
  phase.value = 'playing'
}

function endGame() {
  phase.value = 'over'
  lastReward.value = reportResult({
    gameId: 'bubble-pop',
    score: score.value,
    stats: { goldenPops },
  })
}

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth * 1.2, 520)
  ctx = canvas.getContext('2d')

  attachPointer(canvas, {
    onDown: ({ x, y }) => {
      if (phase.value !== 'playing') return
      // generous hit area: nearest bubble within 1.4x radius
      let best: Bubble | null = null
      let bestDist = Infinity
      for (const b of bubbles) {
        const dx = b.x - x
        const dy = b.y - y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < b.r * 1.4 && d < bestDist) {
          best = b
          bestDist = d
        }
      }
      if (best) popChain(best)
      else {
        combo.value = 0
        sfx.error()
      }
    },
  })
})

useGameLoop((dt, time) => {
  if (!ctx) return
  const ctx2d = ctx
  const { width, height } = ctx2d.canvas

  if (phase.value === 'playing') {
    elapsed += dt
    timeLeft.value = Math.max(GAME_LENGTH - elapsed, 0)
    if (timeLeft.value <= 0) endGame()

    if (comboTimer > 0) {
      comboTimer -= dt
      if (comboTimer <= 0) combo.value = 0
    }

    // spawn rate ramps up as time runs down
    spawnTimer -= dt
    if (spawnTimer <= 0) {
      spawnTimer = 0.55 - (elapsed / GAME_LENGTH) * 0.3
      spawnBubble(width, height, Math.random() < 0.04)
    }

    for (const b of bubbles) {
      b.y += b.vy * dt
      b.x += Math.sin(time * 2 + b.wobblePhase) * 14 * dt
      b.squish += (1 - b.squish) * dt * 8
    }
    bubbles = bubbles.filter((b) => b.y > -b.r * 2)
  }

  particles.update(dt)
  shake.update(dt)

  ctx2d.clearRect(0, 0, width, height)
  ctx2d.save()
  ctx2d.translate(shake.x, shake.y)

  for (const b of bubbles) {
    const wobble = 1 + Math.sin(time * 3 + b.wobblePhase) * 0.04
    ctx2d.save()
    ctx2d.translate(b.x, b.y)
    ctx2d.scale(wobble * b.squish, (2 - wobble) * b.squish)
    // body
    ctx2d.beginPath()
    ctx2d.arc(0, 0, b.r, 0, Math.PI * 2)
    ctx2d.fillStyle = b.color + '33'
    ctx2d.fill()
    ctx2d.lineWidth = 2
    ctx2d.strokeStyle = b.color
    if (b.golden) {
      ctx2d.shadowColor = GOLD
      ctx2d.shadowBlur = 18 + Math.sin(time * 6) * 8
    }
    ctx2d.stroke()
    ctx2d.shadowBlur = 0
    // specular highlight
    ctx2d.beginPath()
    ctx2d.arc(-b.r * 0.35, -b.r * 0.35, b.r * 0.18, 0, Math.PI * 2)
    ctx2d.fillStyle = 'rgba(255,255,255,0.7)'
    ctx2d.fill()
    ctx2d.restore()
  }

  particles.render(ctx2d)
  ctx2d.restore()
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
        <span class="stat-label">COMBO</span>
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
        <h3>BUBBLE POP</h3>
        <p>Tap bubbles to pop same-color chains.<br />Chains build combos. Gold pays Compute.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>ROUND COMPLETE</h3>
        <p class="final num">{{ formatNumber(score) }} pts</p>
        <p v-if="lastReward" class="reward">
          <span class="dollars-text num">+${{ formatNumber(lastReward.dollars) }}</span>
          <span v-if="lastReward.compute" class="compute-text num"> +{{ lastReward.compute }} Compute</span>
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
  color: var(--prestige);
  text-shadow: var(--glow-sm) var(--prestige-glow);
  transform: scale(1.15);
}
</style>
