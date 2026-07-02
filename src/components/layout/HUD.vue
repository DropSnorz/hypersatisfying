<script setup>
import { ref, watch } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { formatNumber, countUp } from '../../engine/numberFormat'

const game = useGameStore()

// displayed values lag behind store values via count-up animation
const shownShards = ref(game.shards)
const shownCores = ref(game.cores)
const shownMastery = ref(game.mastery)
const bumping = ref('')

function animate(shown, target, key) {
  countUp(shown.value, target, {
    duration: 0.7,
    onUpdate: (v) => (shown.value = v),
  })
  bumping.value = key
  setTimeout(() => (bumping.value = ''), 350)
}

watch(() => game.shards, (v) => animate(shownShards, v, 'shards'))
watch(() => game.cores, (v) => animate(shownCores, v, 'cores'))
watch(() => game.mastery, (v) => animate(shownMastery, v, 'mastery'))
</script>

<template>
  <header class="hud glass">
    <div class="currency" :class="{ bump: bumping === 'shards' }">
      <span class="orb shards-orb"></span>
      <span class="num value shards-text">{{ formatNumber(shownShards) }}</span>
    </div>
    <div class="currency" :class="{ bump: bumping === 'cores' }">
      <span class="orb cores-orb"></span>
      <span class="num value cores-text">{{ formatNumber(shownCores) }}</span>
    </div>
    <div class="currency mastery" :class="{ bump: bumping === 'mastery' }">
      <span class="label">MASTERY</span>
      <span class="num value mastery-text">{{ formatNumber(shownMastery) }}</span>
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

.shards-orb {
  background: var(--shards);
  box-shadow: var(--glow-sm) var(--shards-glow);
}

.cores-orb {
  background: var(--cores);
  box-shadow: var(--glow-sm) var(--cores-glow);
}

.value {
  font-weight: 700;
  font-size: 15px;
}

.shards-text { color: var(--shards); }
.cores-text { color: var(--cores); }
.mastery-text { color: var(--mastery); }

.mastery {
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
