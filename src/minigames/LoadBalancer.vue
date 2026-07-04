<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameLoop } from '../composables/useGameLoop'
import { useMinigameResult, type MinigameResult } from '../composables/useMinigameResult'
import { ParticleSystem } from '../engine/particles'
import { ScreenShake } from '../engine/screenShake'
import { attachPointer } from '../engine/inputPointer'
import { sfx } from '../engine/soundManager'
import { formatNumber } from '../engine/numberFormat'

type Phase = 'ready' | 'playing' | 'over'
type Judgement = '' | 'BALANCED' | 'ROUTED' | 'DROPPED' | 'OVERFLOW'

const LIVES = 3
const QUEUE_CAP = 60 // combined pending requests before the balancer chokes

const LEFT_COLOR = '#38d6ff'
const RIGHT_COLOR = '#8b7bff'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const streak = ref(0)
const lives = ref(LIVES)
const phase = ref<Phase>('ready')
const lastReward = ref<MinigameResult | null>(null)
const judgement = ref<Judgement>('')

const { reportResult } = useMinigameResult()

const particles = new ParticleSystem()
const shake = new ScreenShake()
let ctx: CanvasRenderingContext2D | null = null
let markerT = 0 // 0..1 sweep position along the bar
let dir = 1
let speed = 0.55 // sweeps per second, ramps up
let leftQ = 4 // pending requests per pool
let rightQ = 4
let leftRate = 2 // arrivals per second — the two rates differ, skewing
let rightRate = 3 // the balance point the gold zone sits on
let bestStreak = 0
let elapsed = 0
let flashT = 0
let judgeTimeout = 0

function zoneWidth() {
  return Math.max(0.05, 0.16 - streak.value * 0.004)
}

/**
 * The gold zone sits on the traffic balance point: the busier the left
 * pool, the further left you must dispatch. Drifts live as queues grow.
 */
function zoneCenter() {
  const total = leftQ + rightQ
  if (total <= 0) return 0.5
  return Math.min(Math.max(leftQ / total, 0.1), 0.9)
}

function newRates() {
  // deliberately asymmetric arrival rates so the balance point keeps moving
  leftRate = (1.2 + Math.random() * 3.2) * (1 + elapsed * 0.015)
  rightRate = (1.2 + Math.random() * 3.2) * (1 + elapsed * 0.015)
}

function setJudgement(j: Judgement) {
  judgement.value = j
  clearTimeout(judgeTimeout)
  judgeTimeout = setTimeout(() => (judgement.value = ''), 550)
}

function queueAnchors() {
  const { width, height } = ctx!.canvas
  return {
    left: { x: width * 0.11, y: height * 0.5 },
    right: { x: width * 0.89, y: height * 0.5 },
    barY: height / 2,
    barX0: width * 0.2,
    barW: width * 0.6,
  }
}

function dispatch() {
  if (phase.value !== 'playing' || !ctx) return
  const center = zoneCenter()
  const w = zoneWidth()
  const dist = Math.abs(markerT - center)
  const { left, right, barY, barX0, barW } = queueAnchors()
  const mx = barX0 + markerT * barW

  if (dist < w * 0.25) {
    // BALANCED: dispatched right on the balance point — both pools drain
    streak.value++
    bestStreak = Math.max(bestStreak, streak.value)
    score.value += Math.floor(10 + (leftQ + rightQ) / 3 + streak.value * 2)
    setJudgement('BALANCED')
    particles.burst(mx, barY, { colors: ['#ffc83d', '#ffffff'], count: 24, speed: 250, shape: 'spark' })
    particles.burst(left.x, left.y, { colors: [LEFT_COLOR], count: 12, speed: 180 })
    particles.burst(right.x, right.y, { colors: [RIGHT_COLOR], count: 12, speed: 180 })
    shake.shake(6, 0.2)
    sfx.chime(Math.min(streak.value, 7))
    flashT = 1
    leftQ = 1 + Math.random() * 2
    rightQ = 1 + Math.random() * 2
    newRates()
  } else if (dist < w * 0.6) {
    // close enough: half the backlog gets through
    streak.value = 0
    score.value += 4
    setJudgement('ROUTED')
    particles.burst(mx, barY, { colors: [LEFT_COLOR], count: 10, speed: 150 })
    sfx.pop(1.2)
    leftQ /= 2
    rightQ /= 2
    newRates()
  } else {
    // dispatched into the wrong pool: requests dropped
    streak.value = 0
    lives.value--
    setJudgement('DROPPED')
    shake.shake(9, 0.3)
    sfx.error()
    if (lives.value <= 0) {
      endGame()
      return
    }
  }
  speed = Math.min(speed + 0.025, 1.5)
}

function overflow() {
  // backlog exceeded capacity while you hesitated
  streak.value = 0
  lives.value--
  setJudgement('OVERFLOW')
  const { left, right } = queueAnchors()
  particles.burst(left.x, left.y, { colors: ['#ff5470', '#ffaa00'], count: 20, speed: 260, size: 5 })
  particles.burst(right.x, right.y, { colors: ['#ff5470', '#ffaa00'], count: 20, speed: 260, size: 5 })
  shake.shake(13, 0.4)
  sfx.thud()
  leftQ = 3
  rightQ = 3
  newRates()
  if (lives.value <= 0) endGame()
}

function startGame() {
  score.value = 0
  streak.value = 0
  lives.value = LIVES
  bestStreak = 0
  elapsed = 0
  speed = 0.55
  markerT = 0
  dir = 1
  leftQ = 4
  rightQ = 4
  lastReward.value = null
  newRates()
  phase.value = 'playing'
}

function endGame() {
  phase.value = 'over'
  lastReward.value = reportResult({
    gameId: 'load-balancer',
    score: score.value,
    stats: { bestStreak },
  })
}

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth * 1.1, 480)
  ctx = canvas.getContext('2d')
  attachPointer(canvas, { onDown: dispatch })
})

useGameLoop((dt, time) => {
  if (!ctx) return
  const ctx2d = ctx
  const { width, height } = ctx2d.canvas

  if (phase.value === 'playing') {
    elapsed += dt
    markerT += dir * speed * dt
    if (markerT >= 1) { markerT = 1; dir = -1 }
    if (markerT <= 0) { markerT = 0; dir = 1 }

    leftQ += leftRate * dt
    rightQ += rightRate * dt
    if (leftQ + rightQ >= QUEUE_CAP) overflow()
  }

  particles.update(dt)
  shake.update(dt)
  if (flashT > 0) flashT = Math.max(flashT - dt * 3, 0)

  ctx2d.clearRect(0, 0, width, height)
  ctx2d.save()
  ctx2d.translate(shake.x, shake.y)

  const { left, right, barY, barX0, barW } = queueAnchors()
  const pools = [
    { anchor: left, q: leftQ, rate: leftRate, color: LEFT_COLOR, dir: 1 },
    { anchor: right, q: rightQ, rate: rightRate, color: RIGHT_COLOR, dir: -1 },
  ]

  // request pools: stacked pending-request bars + arrival rain whose
  // density shows each pool's arrival rate
  const pressure = Math.min((leftQ + rightQ) / QUEUE_CAP, 1)
  for (const pool of pools) {
    const { anchor, q, rate, color } = pool
    const count = Math.min(Math.floor(q), 30)

    // arrival rain above the pool, denser when the rate is higher
    ctx2d.fillStyle = color + '77'
    const drops = Math.round(rate * 2.4)
    for (let i = 0; i < drops; i++) {
      const px = anchor.x - 12 + (((i * 53) % 24))
      const py = (time * (60 + (i % 4) * 22) + i * 71) % (height * 0.3)
      ctx2d.fillRect(px, py, 2, 5)
    }

    // stack of queued requests growing up from the pool base
    const stackBase = height * 0.72
    for (let i = 0; i < count; i++) {
      const hotRow = pressure > 0.75 && i > count - 4
      ctx2d.beginPath()
      ctx2d.roundRect(anchor.x - 15, stackBase - i * 7, 30, 5, 2)
      ctx2d.fillStyle = hotRow ? '#ff5470cc' : color + (i % 2 ? 'aa' : '66')
      if (hotRow) {
        ctx2d.shadowColor = '#ff5470'
        ctx2d.shadowBlur = 8 + Math.sin(time * 14) * 4
      }
      ctx2d.fill()
      ctx2d.shadowBlur = 0
    }

    // pool count readout
    ctx2d.font = `700 12px 'JetBrains Mono', monospace`
    ctx2d.textAlign = 'center'
    ctx2d.fillStyle = pressure > 0.75 ? '#ff5470' : color
    ctx2d.fillText(`${Math.floor(q)}`, anchor.x, stackBase + 20)
  }

  // capacity warning
  if (pressure > 0.75) {
    ctx2d.font = `700 11px 'JetBrains Mono', monospace`
    ctx2d.textAlign = 'center'
    ctx2d.fillStyle = `rgba(255, 84, 112, ${0.5 + Math.sin(time * 10) * 0.4})`
    ctx2d.fillText('BACKLOG CRITICAL', width / 2, height * 0.82)
  }

  // dispatch bar (the original reflex bar, driven by the queue ratio)
  const center = zoneCenter()
  const w = zoneWidth()

  ctx2d.lineCap = 'round'
  ctx2d.lineWidth = 6
  ctx2d.strokeStyle = 'rgba(140, 180, 255, 0.15)'
  ctx2d.beginPath()
  ctx2d.moveTo(barX0, barY)
  ctx2d.lineTo(barX0 + barW, barY)
  ctx2d.stroke()

  // balance zone (glows on a balanced dispatch via flashT)
  const zx0 = barX0 + (center - w / 2) * barW
  ctx2d.lineWidth = 18 + flashT * 14
  ctx2d.strokeStyle = `rgba(255, 200, 61, ${0.35 + flashT * 0.55})`
  ctx2d.shadowColor = '#ffc83d'
  ctx2d.shadowBlur = 12 + flashT * 30
  ctx2d.beginPath()
  ctx2d.moveTo(zx0, barY)
  ctx2d.lineTo(zx0 + w * barW, barY)
  ctx2d.stroke()
  ctx2d.shadowBlur = 0

  // perfect core of the zone
  ctx2d.lineWidth = 18 + flashT * 14
  ctx2d.strokeStyle = `rgba(255, 255, 255, ${0.25 + flashT * 0.5})`
  const px0 = barX0 + (center - (w * 0.25) / 2) * barW
  ctx2d.beginPath()
  ctx2d.moveTo(px0, barY)
  ctx2d.lineTo(px0 + w * 0.25 * barW, barY)
  ctx2d.stroke()

  // feeder lines from each pool into the bar ends
  ctx2d.lineWidth = 1.5
  ctx2d.setLineDash([3, 5])
  ctx2d.strokeStyle = LEFT_COLOR + '55'
  ctx2d.beginPath()
  ctx2d.moveTo(left.x + 18, barY)
  ctx2d.lineTo(barX0 - 6, barY)
  ctx2d.stroke()
  ctx2d.strokeStyle = RIGHT_COLOR + '55'
  ctx2d.beginPath()
  ctx2d.moveTo(barX0 + barW + 6, barY)
  ctx2d.lineTo(right.x - 18, barY)
  ctx2d.stroke()
  ctx2d.setLineDash([])

  // marker
  const mx = barX0 + markerT * barW
  const pulse = 1 + Math.sin(time * 10) * 0.08
  ctx2d.beginPath()
  ctx2d.arc(mx, barY, 13 * pulse, 0, Math.PI * 2)
  ctx2d.fillStyle = '#e8eefc'
  ctx2d.shadowColor = '#38d6ff'
  ctx2d.shadowBlur = 22
  ctx2d.fill()
  ctx2d.shadowBlur = 0

  // streak heat readout
  if (streak.value > 0) {
    const heat = Math.min(streak.value / 15, 1)
    ctx2d.fillStyle = `rgba(255, ${200 - heat * 120}, ${61 * (1 - heat)}, ${0.5 + heat * 0.5})`
    ctx2d.font = `700 ${18 + heat * 14}px 'JetBrains Mono', monospace`
    ctx2d.textAlign = 'center'
    ctx2d.shadowColor = '#ffc83d'
    ctx2d.shadowBlur = heat * 24
    ctx2d.fillText(`×${streak.value}`, width / 2, barY + 70)
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
        <span class="stat-label">SCORE</span>
        <span class="stat-value num">{{ formatNumber(score) }}</span>
      </div>
      <div class="stat judge" :class="judgement === 'BALANCED' ? 'perfect' : judgement === 'ROUTED' ? 'good' : judgement ? 'miss' : ''">
        <span class="judge-text">{{ judgement || '·' }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">UPTIME</span>
        <span class="stat-value num">{{ '●'.repeat(lives) || '—' }}</span>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasEl" class="game-canvas glass"></canvas>

      <div v-if="phase === 'ready'" class="overlay">
        <h3>LOAD BALANCER</h3>
        <p>Requests pile into two pools at different rates.<br />The gold zone sits on the balance point — tap when the marker crosses it.<br />Sloppy dispatches drop requests. Full backlog overflows.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>BALANCER DOWN</h3>
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
.judge-text {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
  transition: all var(--dur-fast);
  white-space: nowrap;
}

.judge.perfect .judge-text {
  color: var(--prestige);
  text-shadow: var(--glow-md) var(--prestige-glow);
  transform: scale(1.22);
}

.judge.good .judge-text {
  color: var(--dollars);
}

.judge.miss .judge-text {
  color: var(--danger);
}
</style>
