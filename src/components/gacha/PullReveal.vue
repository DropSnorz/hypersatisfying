<script setup>
import { onMounted, ref } from 'vue'
import RarityCard from './RarityCard.vue'
import { RARITIES } from '../../gacha/itemPool'
import { useGameLoop } from '../../composables/useGameLoop'
import { ParticleSystem } from '../../engine/particles'
import { ScreenShake } from '../../engine/screenShake'
import { sfx } from '../../engine/soundManager'

const props = defineProps({
  results: { type: Array, required: true }, // items in pull order
})
const emit = defineEmits(['done'])

const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }

const canvasEl = ref(null)
const stage = ref('charging') // charging | cracked | cards
const revealedCount = ref(0)
const skippable = ref(false)

const particles = new ParticleSystem()
const shake = new ScreenShake()
let ctx = null
let chargeT = 0

// best rarity drives the anticipation length and burst color
const best = props.results.reduce((a, b) => (RANK[b.rarity] > RANK[a.rarity] ? b : a))
const bestRank = RANK[best.rarity]
const bestHex = RARITIES[best.rarity].hex
// reveal order: save the best for last on multi-pulls
const ordered = [...props.results].sort((a, b) => RANK[a.rarity] - RANK[b.rarity])

const chargeDuration = 1 + bestRank * 0.35

function crack() {
  stage.value = 'cracked'
  const { width, height } = ctx.canvas
  particles.burst(width / 2, height / 2, {
    colors: [bestHex, '#ffffff'],
    count: 30 + bestRank * 25,
    speed: 220 + bestRank * 90,
    size: 5 + bestRank,
    life: 0.8,
    gravity: 160,
  })
  if (bestRank >= 3) {
    particles.confetti(width / 2, height / 2 - 40)
    shake.shake(6 + bestRank * 4, 0.5)
    sfx.fanfare()
  } else {
    shake.shake(4, 0.25)
    sfx.thud()
  }
  // cards start flipping shortly after the burst
  setTimeout(() => {
    stage.value = 'cards'
    revealNext()
  }, 550)
}

function revealNext() {
  if (revealedCount.value >= ordered.length) return
  revealedCount.value++
  const item = ordered[revealedCount.value - 1]
  const isLast = revealedCount.value === ordered.length
  sfx.chime(Math.min(RANK[item.rarity] * 2, 7))
  if (RANK[item.rarity] >= 3) shake.shake(5 + RANK[item.rarity] * 2, 0.3)
  if (revealedCount.value < ordered.length) {
    // last card (the best) gets a dramatic pause
    setTimeout(revealNext, isLast || revealedCount.value === ordered.length - 1 ? 700 : 240)
  }
}

function skip() {
  if (stage.value !== 'cards') {
    stage.value = 'cards'
  }
  revealedCount.value = ordered.length
}

onMounted(() => {
  const canvas = canvasEl.value
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  ctx = canvas.getContext('2d')
  sfx.whoosh()
  setTimeout(() => (skippable.value = true), 600)
})

useGameLoop((dt, time) => {
  if (!ctx) return
  const { width, height } = ctx.canvas
  particles.update(dt)
  shake.update(dt)

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(shake.x, shake.y)

  if (stage.value === 'charging') {
    chargeT += dt
    const p = Math.min(chargeT / chargeDuration, 1)
    // orb pulses faster and glows harder as it charges
    const pulse = 1 + Math.sin(time * (6 + p * 18)) * 0.12 * (0.4 + p)
    const r = (30 + p * 26) * pulse
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2)
    ctx.fillStyle = bestHex + '22'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = bestHex
    ctx.shadowColor = bestHex
    ctx.shadowBlur = 20 + p * 50
    ctx.stroke()
    ctx.shadowBlur = 0
    // orbiting sparks
    for (let i = 0; i < 3; i++) {
      const a = time * (3 + p * 6) + (i * Math.PI * 2) / 3
      ctx.beginPath()
      ctx.arc(width / 2 + Math.cos(a) * (r + 16), height / 2 + Math.sin(a) * (r + 16), 3, 0, Math.PI * 2)
      ctx.fillStyle = bestHex
      ctx.fill()
    }
    if (p >= 1) crack()
  }

  particles.render(ctx)
  ctx.restore()
})
</script>

<template>
  <div class="reveal-overlay">
    <canvas ref="canvasEl" class="reveal-canvas"></canvas>

    <div v-if="stage === 'cards'" class="cards" :class="{ single: ordered.length === 1 }">
      <RarityCard
        v-for="(item, i) in ordered"
        :key="i"
        v-show="i < revealedCount"
        :item="item"
        :big="ordered.length === 1"
      />
    </div>

    <div class="actions">
      <button
        v-if="skippable && revealedCount < ordered.length"
        class="ghost-btn"
        @click="skip"
      >
        SKIP
      </button>
      <button
        v-if="revealedCount >= ordered.length"
        class="cta pop-in"
        @click="emit('done')"
      >
        COLLECT
      </button>
    </div>
  </div>
</template>

<style scoped>
.reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(4, 6, 12, 0.97);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cards :deep(.card) {
  background: var(--surface-glass-strong);
  min-width: 0;
  overflow: hidden;
}

/* descriptions don't fit on small multi-pull cards */
.cards:not(.single) :deep(.item-desc) {
  display: none;
}

.reveal-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cards {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  padding: var(--space-4);
  max-width: 560px;
  width: 100%;
}

.cards.single {
  grid-template-columns: minmax(0, 240px);
  justify-content: center;
}

.actions {
  position: absolute;
  bottom: 48px;
  display: flex;
  gap: var(--space-3);
}

.ghost-btn {
  padding: var(--space-2) var(--space-5);
  border: 1px solid var(--surface-border-bright);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 0.15em;
}

.cta {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.15em;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  color: var(--bg-deep);
  background: var(--prestige);
  box-shadow: var(--glow-md) var(--prestige-glow);
}

</style>
