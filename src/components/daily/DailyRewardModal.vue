<script setup lang="ts">
import { ref } from 'vue'
import { useDailyStore, DAILY_CYCLE, type DailyClaimResult } from '../../stores/dailyStore'
import { useGameStore } from '../../stores/gameStore'
import { useJuice } from '../../composables/useJuice'
import { formatNumber } from '../../engine/numberFormat'
import { sfx } from '../../engine/soundManager'

const daily = useDailyStore()
const game = useGameStore()
const { toast } = useJuice()

const open = ref(daily.canClaim)
const claimed = ref<DailyClaimResult | null>(null)

function claim() {
  const reward = daily.claim()
  if (!reward) {
    open.value = false
    return
  }
  game.addDollars(reward.dollars)
  if (reward.compute) game.addCompute(reward.compute)
  claimed.value = reward
  sfx.fanfare()
  toast(`+$${formatNumber(reward.dollars)}`, { kind: 'dollars' })
  if (reward.compute) toast(`+${reward.compute} Compute`, { kind: 'compute' })
  setTimeout(() => (open.value = false), 1400)
}
</script>

<template>
  <div v-if="open" class="daily-backdrop">
    <div class="daily glass pop-in">
      <h3>DAILY UPLINK</h3>
      <p class="streak-line">
        Streak <span class="num streak">{{ daily.streak + (claimed ? 0 : 1) }}</span>
      </p>
      <div class="days">
        <div
          v-for="(r, i) in DAILY_CYCLE"
          :key="i"
          class="day"
          :class="{ current: i === daily.cycleIndex && !claimed, past: i < daily.cycleIndex, jackpot: i === 6 }"
        >
          <span class="d-num">D{{ i + 1 }}</span>
          <span class="d-dollars num">${{ formatNumber(r.dollars) }}</span>
          <span v-if="r.compute" class="d-compute num">+{{ r.compute }}◆</span>
        </div>
      </div>
      <button v-if="!claimed" class="cta" @click="claim">CLAIM</button>
      <p v-else class="claimed-msg">Uplink complete.</p>
    </div>
  </div>
</template>

<style scoped>
.daily-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 6, 12, 0.8);
  backdrop-filter: blur(6px);
}

.daily {
  width: min(92vw, 420px);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  background: var(--surface-glass-strong);
}

h3 {
  font-family: var(--font-display);
  letter-spacing: 0.15em;
  font-size: 16px;
}

.streak-line {
  font-size: 12px;
  color: var(--text-secondary);
}

.streak {
  color: var(--prestige);
  font-weight: 700;
  font-size: 15px;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
  width: 100%;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-2) 2px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.day.past {
  opacity: 0.35;
}

.day.current {
  border-color: var(--dollars);
  box-shadow: var(--glow-sm) var(--dollars-glow);
  animation: throb 1.4s ease-in-out infinite;
}

.day.jackpot {
  border-color: var(--prestige);
}

@keyframes throb {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

.d-num {
  font-size: 8px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
}

.d-dollars {
  font-size: 10px;
  color: var(--dollars);
}

.d-compute {
  font-size: 9px;
  color: var(--compute);
}

.claimed-msg {
  color: var(--success);
  font-size: 13px;
}
</style>
