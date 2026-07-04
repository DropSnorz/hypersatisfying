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
type Judgement = '' | 'PERFECT EVICTION' | 'EVICTED' | 'WASTED'

interface Server {
  load: number // 0..1
  rate: number // load growth per second
  flashT: number // flush animation 0..1
  overloadT: number // overload flash 0..1
}

const SERVERS = 4
const LIVES = 3
const HOT_ZONE = 0.7 // flushing at load >= this is a perfect route

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
let servers: Server[] = []
let needleT = 0 // 0..1 sweep position across the rack row
let needleDir = 1
let needleSpeed = 0.5 // sweeps per second, ramps up
let intensity = 1 // global traffic multiplier, ramps up
let elapsed = 0
let bestStreak = 0
let perfectEvictions = 0
let judgeTimeout = 0

const SERVER_COLORS = ['#38d6ff', '#8b7bff', '#3dffa0', '#ff4dd8']

function rackRect(i: number) {
  const { width, height } = ctx!.canvas
  const pad = width * 0.06
  const gap = width * 0.03
  const w = (width - pad * 2 - gap * (SERVERS - 1)) / SERVERS
  const h = height * 0.52
  return { x: pad + i * (w + gap), y: height * 0.3, w, h }
}

function needleServer(): number {
  // which rack the needle currently points at
  return Math.min((needleT * SERVERS) | 0, SERVERS - 1)
}

function setJudgement(j: Judgement) {
  judgement.value = j
  clearTimeout(judgeTimeout)
  judgeTimeout = setTimeout(() => (judgement.value = ''), 550)
}

function newRate() {
  // load growth per second, scaled by ramping intensity — gentle at
  // t=0 (~12-25s to overload) so the opening doesn't punish learning
  return (0.04 + Math.random() * 0.045) * intensity
}

function evict() {
  if (phase.value !== 'playing' || !ctx) return
  const i = needleServer()
  const server = servers[i]
  const rect = rackRect(i)
  const loadY = rect.y + rect.h * (1 - server.load)

  if (server.load >= HOT_ZONE) {
    // PERFECT: drained a rack right before it tipped over
    streak.value++
    bestStreak = Math.max(bestStreak, streak.value)
    perfectEvictions++
    score.value += Math.floor(10 + server.load * 20 + streak.value * 2)
    setJudgement('PERFECT EVICTION')
    particles.burst(rect.x + rect.w / 2, loadY, {
      colors: ['#ffc83d', '#ffffff', SERVER_COLORS[i]],
      count: 30,
      speed: 280,
      shape: 'spark',
      gravity: 140,
    })
    shake.shake(6, 0.2)
    sfx.chime(Math.min(streak.value, 7))
    server.flashT = 1
  } else if (server.load >= 0.35) {
    // fine, but the traffic wasn't urgent yet
    streak.value = 0
    score.value += 3
    setJudgement('EVICTED')
    particles.burst(rect.x + rect.w / 2, loadY, {
      colors: [SERVER_COLORS[i]],
      count: 10,
      speed: 150,
    })
    sfx.pop(1.2)
  } else {
    // wasted a dispatch on an idle rack
    streak.value = 0
    setJudgement('WASTED')
    sfx.error()
  }

  server.load = 0.04
  server.rate = newRate()
}

function overload(i: number) {
  const server = servers[i]
  const rect = rackRect(i)
  server.load = 0.15
  server.rate = newRate()
  server.overloadT = 1
  streak.value = 0
  lives.value--
  particles.burst(rect.x + rect.w / 2, rect.y + rect.h * 0.2, {
    colors: ['#ff5470', '#ffaa00'],
    count: 36,
    speed: 300,
    size: 6,
  })
  shake.shake(14, 0.45)
  sfx.thud()
  if (lives.value <= 0) endGame()
}

function startGame() {
  intensity = 1
  servers = Array.from({ length: SERVERS }, (_, i) => ({
    load: 0.1 + i * 0.12, // staggered so racks don't all peak together
    rate: 0,
    flashT: 0,
    overloadT: 0,
  }))
  servers.forEach((s) => (s.rate = newRate()))
  score.value = 0
  streak.value = 0
  lives.value = LIVES
  bestStreak = 0
  perfectEvictions = 0
  elapsed = 0
  needleT = 0
  needleDir = 1
  needleSpeed = 0.5
  lastReward.value = null
  phase.value = 'playing'
}

function endGame() {
  phase.value = 'over'
  lastReward.value = reportResult({
    gameId: 'eviction-scheduler',
    score: score.value,
    stats: { bestStreak, perfectEvictions },
  })
}

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = Math.min(canvas.clientWidth * 1.1, 480)
  ctx = canvas.getContext('2d')
  attachPointer(canvas, { onDown: evict })
})

useGameLoop((dt, time) => {
  if (!ctx) return
  const ctx2d = ctx
  const { width, height } = ctx2d.canvas

  if (phase.value === 'playing') {
    elapsed += dt
    // difficulty ramp: traffic and needle both speed up
    intensity = 1 + elapsed * 0.035
    needleSpeed = Math.min(0.5 + elapsed * 0.012, 1.4)

    needleT += needleDir * needleSpeed * dt
    if (needleT >= 1) { needleT = 1; needleDir = -1 }
    if (needleT <= 0) { needleT = 0; needleDir = 1 }

    for (let i = 0; i < servers.length; i++) {
      const s = servers[i]
      s.load += s.rate * dt
      if (s.load >= 1) overload(i)
    }
  }

  for (const s of servers) {
    s.flashT = Math.max(s.flashT - dt * 3, 0)
    s.overloadT = Math.max(s.overloadT - dt * 2, 0)
  }
  particles.update(dt)
  shake.update(dt)

  ctx2d.clearRect(0, 0, width, height)
  ctx2d.save()
  ctx2d.translate(shake.x, shake.y)

  // incoming traffic stream raining toward the racks
  ctx2d.fillStyle = 'rgba(140, 180, 255, 0.35)'
  for (let i = 0; i < 14; i++) {
    const px = (((i * 97) % 100) / 100) * width
    const py = (time * (40 + (i % 5) * 14) + i * 53) % (height * 0.22)
    ctx2d.fillRect(px, py, 2, 6)
  }

  const active = needleServer()

  for (let i = 0; i < servers.length; i++) {
    const s = servers[i]
    const { x, y, w, h } = rackRect(i)
    const color = SERVER_COLORS[i]
    const hot = s.load >= HOT_ZONE
    const nearTip = s.load > 0.92

    // rack chassis
    ctx2d.beginPath()
    ctx2d.roundRect(x, y, w, h, 8)
    ctx2d.fillStyle = 'rgba(140, 180, 255, 0.05)'
    ctx2d.fill()
    ctx2d.lineWidth = i === active ? 2.5 : 1.5
    if (s.overloadT > 0) {
      ctx2d.strokeStyle = `rgba(255, 84, 112, ${0.4 + s.overloadT * 0.6})`
      ctx2d.shadowColor = '#ff5470'
      ctx2d.shadowBlur = s.overloadT * 30
    } else if (i === active) {
      ctx2d.strokeStyle = 'rgba(232, 238, 252, 0.9)'
      ctx2d.shadowColor = '#e8eefc'
      ctx2d.shadowBlur = 10
    } else {
      ctx2d.strokeStyle = 'rgba(140, 180, 255, 0.25)'
    }
    ctx2d.stroke()
    ctx2d.shadowBlur = 0

    // hot-zone threshold line (flush above this for a perfect route)
    const hotY = y + h * (1 - HOT_ZONE)
    ctx2d.setLineDash([4, 4])
    ctx2d.lineWidth = 1
    ctx2d.strokeStyle = 'rgba(255, 200, 61, 0.5)'
    ctx2d.beginPath()
    ctx2d.moveTo(x + 3, hotY)
    ctx2d.lineTo(x + w - 3, hotY)
    ctx2d.stroke()
    ctx2d.setLineDash([])

    // load fill: rack color when cool, gold in the hot zone, red near tipping
    const loadH = h * Math.min(s.load, 1)
    const fill = nearTip ? '#ff5470' : hot ? '#ffc83d' : color
    ctx2d.beginPath()
    ctx2d.roundRect(x + 4, y + h - Math.max(loadH - 4, 2) - 4, w - 8, Math.max(loadH - 4, 2), 5)
    ctx2d.fillStyle = fill + (hot ? 'cc' : '88')
    if (hot) {
      // pulse harder as it gets closer to overload
      ctx2d.shadowColor = fill
      ctx2d.shadowBlur = 10 + Math.sin(time * (nearTip ? 18 : 9)) * 6 + s.load * 14
    }
    ctx2d.fill()
    ctx2d.shadowBlur = 0

    // flush flash
    if (s.flashT > 0) {
      ctx2d.fillStyle = `rgba(255, 255, 255, ${s.flashT * 0.35})`
      ctx2d.beginPath()
      ctx2d.roundRect(x, y, w, h, 8)
      ctx2d.fill()
    }

    // load percentage readout
    ctx2d.font = `700 11px 'JetBrains Mono', monospace`
    ctx2d.textAlign = 'center'
    ctx2d.fillStyle = nearTip ? '#ff5470' : hot ? '#ffc83d' : 'rgba(147, 161, 189, 0.9)'
    ctx2d.fillText(`${Math.floor(s.load * 100)}%`, x + w / 2, y + h + 18)

    // rack LEDs
    for (let led = 0; led < 4; led++) {
      const on = s.load > (led + 1) / 5
      ctx2d.beginPath()
      ctx2d.arc(x + 8 + led * 8, y + 9, 2, 0, Math.PI * 2)
      ctx2d.fillStyle = on ? color : 'rgba(140, 180, 255, 0.15)'
      ctx2d.fill()
    }
  }

  // balancer needle sweeping above the racks
  const first = rackRect(0)
  const last = rackRect(SERVERS - 1)
  const needleY = first.y - 26
  const sweepX = first.x + (last.x + last.w - first.x) * needleT
  const activeRect = rackRect(active)

  // sweep track
  ctx2d.lineWidth = 3
  ctx2d.lineCap = 'round'
  ctx2d.strokeStyle = 'rgba(140, 180, 255, 0.15)'
  ctx2d.beginPath()
  ctx2d.moveTo(first.x, needleY)
  ctx2d.lineTo(last.x + last.w, needleY)
  ctx2d.stroke()

  // needle head
  const pulse = 1 + Math.sin(time * 10) * 0.1
  ctx2d.beginPath()
  ctx2d.moveTo(sweepX, needleY + 10 * pulse)
  ctx2d.lineTo(sweepX - 7, needleY - 6)
  ctx2d.lineTo(sweepX + 7, needleY - 6)
  ctx2d.closePath()
  ctx2d.fillStyle = '#e8eefc'
  ctx2d.shadowColor = '#38d6ff'
  ctx2d.shadowBlur = 16
  ctx2d.fill()
  ctx2d.shadowBlur = 0

  // routing beam down to the active rack
  ctx2d.strokeStyle = 'rgba(232, 238, 252, 0.18)'
  ctx2d.lineWidth = 1.5
  ctx2d.setLineDash([3, 5])
  ctx2d.beginPath()
  ctx2d.moveTo(sweepX, needleY + 12)
  ctx2d.lineTo(activeRect.x + activeRect.w / 2, activeRect.y - 4)
  ctx2d.stroke()
  ctx2d.setLineDash([])

  // streak heat readout
  if (streak.value > 0) {
    const heat = Math.min(streak.value / 15, 1)
    ctx2d.fillStyle = `rgba(255, ${200 - heat * 120}, ${61 * (1 - heat)}, ${0.5 + heat * 0.5})`
    ctx2d.font = `700 ${16 + heat * 12}px 'JetBrains Mono', monospace`
    ctx2d.textAlign = 'center'
    ctx2d.shadowColor = '#ffc83d'
    ctx2d.shadowBlur = heat * 24
    ctx2d.fillText(`×${streak.value}`, width / 2, height - 14)
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
      <div class="stat judge" :class="judgement === 'PERFECT EVICTION' ? 'perfect' : judgement === 'EVICTED' ? 'good' : judgement === 'WASTED' ? 'miss' : ''">
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
        <h3>EVICTION SCHEDULER</h3>
        <p>Pods pile onto the racks. Tap to evict the rack under the needle.<br />Evict above the gold line for a PERFECT EVICTION.<br />Let a rack hit 100% and it melts.</p>
        <button class="cta" @click="startGame">START</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <h3>CLUSTER DOWN</h3>
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
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--text-dim);
  transition: all var(--dur-fast);
  white-space: nowrap;
}

.judge.perfect .judge-text {
  color: var(--prestige);
  text-shadow: var(--glow-md) var(--prestige-glow);
  transform: scale(1.2);
}

.judge.good .judge-text {
  color: var(--dollars);
}

.judge.miss .judge-text {
  color: var(--danger);
}
</style>
