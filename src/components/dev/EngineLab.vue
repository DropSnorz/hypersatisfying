<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameLoop } from '../../composables/useGameLoop'
import { ParticleSystem } from '../../engine/particles'
import { ScreenShake } from '../../engine/screenShake'
import { TweenGroup, easings } from '../../engine/tween'
import { attachPointer } from '../../engine/inputPointer'
import { sfx } from '../../engine/soundManager'
import { formatNumber, countUp } from '../../engine/numberFormat'

/**
 * Dev-only playground (/#/devlab): visually verifies each engine
 * primitive in isolation. Not linked from the UI.
 */
const canvasEl = ref<HTMLCanvasElement | null>(null)
const counter = ref(0)
const particles = new ParticleSystem()
const shake = new ScreenShake()
const tweens = new TweenGroup()
let ctx: CanvasRenderingContext2D | null = null
let pulse = 1

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = 360
  ctx = canvas.getContext('2d')

  attachPointer(canvas, {
    onDown: ({ x, y }) => {
      particles.burst(x, y, { colors: ['#38d6ff', '#ff4dd8', '#ffc83d'], count: 24 })
      shake.shake(7, 0.25)
      sfx.pop(0.8 + Math.random() * 0.6)
      tweens.add({
        from: 1.6, to: 1, duration: 0.5, easing: easings.easeOutElastic,
        onUpdate: (v) => (pulse = v),
      })
      countUp(counter.value, counter.value + 137, {
        onUpdate: (v) => (counter.value = v),
      })
    },
  })
})

useGameLoop((dt) => {
  if (!ctx) return
  const context = ctx
  particles.update(dt)
  shake.update(dt)
  tweens.update(dt)

  const { width, height } = context.canvas
  context.clearRect(0, 0, width, height)
  context.save()
  context.translate(shake.x, shake.y)

  // pulsing center orb to verify tween/elastic feel
  context.beginPath()
  context.arc(width / 2, height / 2, 26 * pulse, 0, Math.PI * 2)
  context.fillStyle = '#38d6ff'
  context.shadowColor = '#38d6ff'
  context.shadowBlur = 30
  context.fill()
  context.shadowBlur = 0

  particles.render(context)
  context.restore()
})
</script>

<template>
  <div class="lab">
    <h2>ENGINE LAB</h2>
    <p>Tap the canvas: burst + shake + elastic pulse + SFX + count-up.</p>
    <div class="counter num">{{ formatNumber(counter) }}</div>
    <canvas ref="canvasEl" class="lab-canvas glass"></canvas>
  </div>
</template>

<style scoped>
.lab {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

h2 {
  font-family: var(--font-display);
  letter-spacing: 0.12em;
}

p {
  color: var(--text-secondary);
  font-size: 13px;
}

.counter {
  font-size: 30px;
  font-weight: 700;
  color: var(--shards);
  text-shadow: var(--glow-md) var(--shards-glow);
}

.lab-canvas {
  width: 100%;
  height: 360px;
  border-radius: var(--radius-lg);
}
</style>
