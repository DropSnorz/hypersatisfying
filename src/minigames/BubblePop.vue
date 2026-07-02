<script setup>
import { onMounted, ref } from 'vue'
import { useGameLoop } from '../composables/useGameLoop'
import { useMinigameResult } from '../composables/useMinigameResult'
import { ParticleSystem } from '../engine/particles'
import { ScreenShake } from '../engine/screenShake'
import { attachPointer } from '../engine/inputPointer'
import { sfx } from '../engine/soundManager'
import { formatNumber } from '../engine/numberFormat'

const GAME_LENGTH = 45
const COLORS = ['#38d6ff', '#ff4dd8', '#8b7bff', '#3dffa0', '#ffc83d']
const GOLD = '#ffe28a'
const CHAIN_RADIUS = 78

const canvasEl = ref(null)
const score = ref(0)
const timeLeft = ref(GAME_LENGTH)
const combo = ref(0)
const phase = ref('ready') // ready | playing | over
const lastReward = ref(null)

const { reportResult } = useMinigameResult()

// --- non-reactive game state (never touched by Vue reactivity) ---
const particles = new ParticleSystem()
const shake = new ScreenShake()
let ctx = null
let bubbles = []
let spawnTimer = 0
let comboTimer = 0
let goldenPops = 0
let elapsed = 0

function spawnBubble(width, height, golden = false) {
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

function popChain(hit) {
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
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth * 1.2, 520)
  ctx = canvas.getContext('2d')

  attachPointer(canvas, {
    onDown: ({ x, y }) => {
      if (phase.value !== 'playing') return
      // generous hit area: nearest bubble within 1.4x radius
      let best = null
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
  const { width, height } = ctx.canvas

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

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(shake.x, shake.y)

  for (const b of bubbles) {
    const wobble = 1 + Math.sin(time * 3 + b.wobblePhase) * 0.04
    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.scale(wobble * b.squish, (2 - wobble) * b.squish)
    // body
    ctx.beginPath()
    ctx.arc(0, 0, b.r, 0, Math.PI * 2)
    ctx.fillStyle = b.color + '33'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = b.color
    if (b.golden) {
      ctx.shadowColor = GOLD
      ctx.shadowBlur = 18 + Math.sin(time * 6) * 8
    }
    ctx.stroke()
    ctx.shadowBlur = 0
    // specular highlight
    ctx.beginPath()
    ctx.arc(-b.r * 0.35, -b.r * 0.35, b.r * 0.18, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fill()
    ctx.restore()
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
        <p>Tap bubbles to pop same-color chains.<br />Chains build combos. Gold pays Cores.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>ROUND COMPLETE</h3>
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
.game {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stat-bar {
  display: flex;
  justify-content: space-between;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--text-dim);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.combo .stat-value {
  transition: all var(--dur-fast);
}

.combo.hot .stat-value {
  color: var(--prestige);
  text-shadow: var(--glow-sm) var(--prestige-glow);
  transform: scale(1.15);
}

.canvas-wrap {
  position: relative;
}

.game-canvas {
  display: block;
  width: 100%;
  border-radius: var(--radius-lg);
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: rgba(6, 9, 16, 0.82);
  backdrop-filter: blur(6px);
  border-radius: var(--radius-lg);
  text-align: center;
}

.overlay h3 {
  font-family: var(--font-display);
  letter-spacing: 0.15em;
  font-size: 20px;
}

.overlay p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.final {
  font-size: 30px !important;
  font-weight: 700;
  color: var(--text-primary) !important;
}

.shards-text { color: var(--shards); }
.cores-text { color: var(--cores); }

.cta {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.15em;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  color: var(--bg-deep);
  background: var(--shards);
  box-shadow: var(--glow-md) var(--shards-glow);
  transition: transform var(--dur-fast) var(--ease-out-back);
}

.cta:hover {
  transform: scale(1.06);
}

.cta:active {
  transform: scale(0.94);
}
</style>
