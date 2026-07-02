<script setup>
import { onMounted, ref } from 'vue'
import { useGameLoop } from '../composables/useGameLoop'
import { useMinigameResult } from '../composables/useMinigameResult'
import { ParticleSystem } from '../engine/particles'
import { ScreenShake } from '../engine/screenShake'
import { attachPointer } from '../engine/inputPointer'
import { sfx } from '../engine/soundManager'
import { formatNumber } from '../engine/numberFormat'

const LIVES = 3

const canvasEl = ref(null)
const score = ref(0)
const streak = ref(0)
const lives = ref(LIVES)
const phase = ref('ready')
const lastReward = ref(null)
const judgement = ref('') // PERFECT / GOOD / MISS flash

const { reportResult } = useMinigameResult()

const particles = new ParticleSystem()
const shake = new ScreenShake()
let ctx = null
let markerT = 0 // 0..1 position along the bar
let dir = 1
let speed = 0.55 // bar sweeps per second, ramps up
let zoneCenter = 0.5
let zoneWidth = 0.16
let bestStreak = 0
let flashT = 0
let judgeTimeout = 0

function newZone() {
  zoneWidth = Math.max(0.05, 0.16 - streak.value * 0.004)
  zoneCenter = 0.15 + Math.random() * 0.7
}

function judge() {
  if (phase.value !== 'playing') return
  const dist = Math.abs(markerT - zoneCenter)
  const canvas = ctx.canvas
  const x = canvas.width * 0.08 + markerT * canvas.width * 0.84
  const y = canvas.height / 2

  if (dist < zoneWidth * 0.25) {
    // PERFECT
    streak.value++
    bestStreak = Math.max(bestStreak, streak.value)
    score.value += 10 + streak.value * 2
    judgement.value = 'PERFECT'
    particles.burst(x, y, { colors: ['#ffc83d', '#ffffff'], count: 26, speed: 260, shape: 'spark' })
    shake.shake(6, 0.2)
    sfx.chime(Math.min(streak.value, 7))
    flashT = 1
  } else if (dist < zoneWidth * 0.6) {
    // GOOD
    streak.value = 0
    score.value += 4
    judgement.value = 'GOOD'
    particles.burst(x, y, { colors: ['#38d6ff'], count: 10, speed: 150 })
    sfx.pop(1.2)
  } else {
    // MISS
    streak.value = 0
    lives.value--
    judgement.value = 'MISS'
    shake.shake(9, 0.3)
    sfx.error()
    if (lives.value <= 0) {
      endGame()
      return
    }
  }
  clearTimeout(judgeTimeout)
  judgeTimeout = setTimeout(() => (judgement.value = ''), 500)
  speed = Math.min(speed + 0.025, 1.5)
  newZone()
}

function startGame() {
  score.value = 0
  streak.value = 0
  lives.value = LIVES
  bestStreak = 0
  speed = 0.55
  markerT = 0
  dir = 1
  lastReward.value = null
  newZone()
  phase.value = 'playing'
}

function endGame() {
  phase.value = 'over'
  lastReward.value = reportResult({
    gameId: 'rhythm-bar',
    score: score.value,
    stats: { bestStreak },
  })
}

onMounted(() => {
  const canvas = canvasEl.value
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth * 1.1, 480)
  ctx = canvas.getContext('2d')
  attachPointer(canvas, { onDown: judge })
})

useGameLoop((dt, time) => {
  if (!ctx) return
  const { width, height } = ctx.canvas

  if (phase.value === 'playing') {
    markerT += dir * speed * dt
    if (markerT >= 1) { markerT = 1; dir = -1 }
    if (markerT <= 0) { markerT = 0; dir = 1 }
  }

  particles.update(dt)
  shake.update(dt)
  if (flashT > 0) flashT = Math.max(flashT - dt * 3, 0)

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(shake.x, shake.y)

  const barY = height / 2
  const barX0 = width * 0.08
  const barW = width * 0.84

  // bar track
  ctx.lineCap = 'round'
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(140, 180, 255, 0.15)'
  ctx.beginPath()
  ctx.moveTo(barX0, barY)
  ctx.lineTo(barX0 + barW, barY)
  ctx.stroke()

  // target zone (glows on perfect via flashT)
  const zx0 = barX0 + (zoneCenter - zoneWidth / 2) * barW
  const zw = zoneWidth * barW
  ctx.lineWidth = 18 + flashT * 14
  ctx.strokeStyle = `rgba(255, 200, 61, ${0.35 + flashT * 0.55})`
  ctx.shadowColor = '#ffc83d'
  ctx.shadowBlur = 12 + flashT * 30
  ctx.beginPath()
  ctx.moveTo(zx0, barY)
  ctx.lineTo(zx0 + zw, barY)
  ctx.stroke()
  ctx.shadowBlur = 0

  // perfect core of the zone
  ctx.lineWidth = 18 + flashT * 14
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + flashT * 0.5})`
  const px0 = barX0 + (zoneCenter - zoneWidth * 0.25 / 2) * barW
  ctx.beginPath()
  ctx.moveTo(px0, barY)
  ctx.lineTo(px0 + zoneWidth * 0.25 * barW, barY)
  ctx.stroke()

  // marker
  const mx = barX0 + markerT * barW
  const pulse = 1 + Math.sin(time * 10) * 0.08
  ctx.beginPath()
  ctx.arc(mx, barY, 13 * pulse, 0, Math.PI * 2)
  ctx.fillStyle = '#38d6ff'
  ctx.shadowColor = '#38d6ff'
  ctx.shadowBlur = 22
  ctx.fill()
  ctx.shadowBlur = 0

  // streak meter heats up under the bar
  if (streak.value > 0) {
    const heat = Math.min(streak.value / 15, 1)
    ctx.fillStyle = `rgba(255, ${200 - heat * 120}, ${61 * (1 - heat)}, ${0.5 + heat * 0.5})`
    ctx.font = `700 ${18 + heat * 14}px 'JetBrains Mono', monospace`
    ctx.textAlign = 'center'
    ctx.shadowColor = '#ffc83d'
    ctx.shadowBlur = heat * 24
    ctx.fillText(`×${streak.value}`, width / 2, barY + 70)
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
      <div class="stat judge" :class="judgement.toLowerCase()">
        <span class="judge-text">{{ judgement || '·' }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">LIVES</span>
        <span class="stat-value num">{{ '●'.repeat(lives) || '—' }}</span>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasEl" class="game-canvas glass"></canvas>

      <div v-if="phase === 'ready'" class="overlay">
        <h3>RHYTHM BAR</h3>
        <p>Tap when the marker crosses the gold zone.<br />The white core is a PERFECT. Perfects chain combos.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>SIGNAL LOST</h3>
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
.judge-text {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  transition: all var(--dur-fast);
}

.judge.perfect .judge-text {
  color: var(--prestige);
  text-shadow: var(--glow-md) var(--prestige-glow);
  transform: scale(1.25);
}

.judge.good .judge-text {
  color: var(--shards);
}

.judge.miss .judge-text {
  color: var(--danger);
}
</style>
