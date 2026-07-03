<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { formatNumber, countUp } from '../../engine/numberFormat'

const game = useGameStore()

// displayed values lag behind store values via count-up animation
const shownDollars = ref(game.dollars)
const shownCompute = ref(game.compute)
const shownScale = ref(game.scale)
const bumping = ref('')

function animate(shown: Ref<number>, target: number, key: string) {
  countUp(shown.value, target, {
    duration: 0.7,
    onUpdate: (v) => (shown.value = v),
  })
  bumping.value = key
  setTimeout(() => (bumping.value = ''), 350)
}

watch(() => game.dollars, (v) => animate(shownDollars, v, 'dollars'))
watch(() => game.compute, (v) => animate(shownCompute, v, 'compute'))
watch(() => game.scale, (v) => animate(shownScale, v, 'scale'))
</script>

<template>
  <header class="hud glass">
    <div class="currency" :class="{ bump: bumping === 'dollars' }">
      <span class="orb dollars-orb"></span>
      <span class="num value dollars-text">${{ formatNumber(shownDollars) }}</span>
    </div>
    <div class="currency" :class="{ bump: bumping === 'compute' }">
      <span class="orb compute-orb"></span>
      <span class="num value compute-text">{{ formatNumber(shownCompute) }}</span>
    </div>
    <div class="currency scale" :class="{ bump: bumping === 'scale' }">
      <span class="label">SCALE</span>
      <span class="num value scale-text">{{ formatNumber(shownScale) }}</span>
    </div>
  </header>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin: var(--space-3) var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-full);
}

.currency {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: transform var(--dur-fast) var(--ease-out-back);
}

.currency.bump {
  transform: scale(1.18);
}

.orb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.dollars-orb {
  background: var(--dollars);
  box-shadow: var(--glow-sm) var(--dollars-glow);
}

.compute-orb {
  background: var(--compute);
  box-shadow: var(--glow-sm) var(--compute-glow);
}

.value {
  font-weight: 700;
  font-size: 15px;
}

.dollars-text { color: var(--dollars); }
.compute-text { color: var(--compute); }
.scale-text { color: var(--scale); }

.scale {
  margin-left: auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

.label {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--text-dim);
}
</style>
