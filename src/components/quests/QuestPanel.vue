<script setup lang="ts">
import { onMounted } from 'vue'
import { useQuestStore, type Quest } from '../../stores/questStore'
import { useGameStore } from '../../stores/gameStore'
import { useJuice } from '../../composables/useJuice'
import { formatNumber } from '../../engine/numberFormat'
import { sfx } from '../../engine/soundManager'

const quests = useQuestStore()
const game = useGameStore()
const { toast } = useJuice()

onMounted(() => quests.refreshIfStale())

function claim(quest: Quest) {
  const reward = quests.claim(quest.id)
  if (!reward) return
  game.addDollars(reward.dollars)
  if (reward.compute) game.addCompute(reward.compute)
  sfx.coin()
  toast(`+$${formatNumber(reward.dollars)}`, { kind: 'dollars' })
  if (reward.compute) toast(`+${reward.compute} Compute`, { kind: 'compute' })
}
</script>

<template>
  <section class="quests glass">
    <div class="q-head">
      <h3>DAILY DIRECTIVES</h3>
      <span class="q-day">resets daily</span>
    </div>
    <div v-for="q in quests.active" :key="q.id" class="quest" :class="{ done: q.claimed }">
      <div class="q-info">
        <span class="q-desc">{{ q.desc }}</span>
        <div class="q-track">
          <div class="q-fill" :style="{ width: `${(q.progress / q.target) * 100}%` }"></div>
        </div>
      </div>
      <button
        v-if="!q.claimed"
        class="q-claim"
        :class="{ ready: q.progress >= q.target }"
        :disabled="q.progress < q.target"
        @click="claim(q)"
      >
        <template v-if="q.progress >= q.target">CLAIM</template>
        <template v-else>{{ q.progress }}/{{ q.target }}</template>
      </button>
      <span v-else class="q-done">✓</span>
    </div>
  </section>
</template>

<style scoped>
.quests {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.q-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.q-head h3 {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.12em;
}

.q-day {
  font-size: 10px;
  color: var(--text-dim);
}

.quest {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.quest.done {
  opacity: 0.45;
}

.q-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.q-desc {
  font-size: 12px;
}

.q-track {
  height: 5px;
  border-radius: var(--radius-full);
  background: rgba(140, 180, 255, 0.1);
  overflow: hidden;
}

.q-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--dollars), var(--scale));
  box-shadow: var(--glow-sm) var(--dollars-glow);
  transition: width var(--dur-med) var(--ease-out-quint);
}

.q-claim {
  min-width: 64px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--surface-border);
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
}

.q-claim.ready {
  color: var(--bg-deep);
  background: var(--success);
  border-color: var(--success);
  box-shadow: var(--glow-sm) rgba(61, 255, 160, 0.5);
  animation: throb 1.2s ease-in-out infinite;
}

@keyframes throb {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}

.q-done {
  color: var(--success);
  font-size: 16px;
  min-width: 64px;
  text-align: center;
}
</style>
