<script setup>
import { MINIGAMES } from '../../minigames/registry'
import { useGameStore } from '../../stores/gameStore'
import { formatNumber } from '../../engine/numberFormat'
import QuestPanel from '../quests/QuestPanel.vue'
import RebirthPanel from '../prestige/RebirthPanel.vue'

const game = useGameStore()
</script>

<template>
  <div class="hub">
    <h1 class="title">HYPER<span class="accent">SATISFYING</span></h1>
    <p class="subtitle">Pick a game. Feed the number.</p>

    <div class="grid">
      <RouterLink
        v-for="mg in MINIGAMES"
        :key="mg.id"
        :to="`/play/${mg.id}`"
        class="card glass"
        :style="{ '--accent': mg.accent }"
      >
        <span class="card-icon">{{ mg.icon }}</span>
        <span class="card-name">{{ mg.name }}</span>
        <span class="card-tag">{{ mg.tagline }}</span>
        <span v-if="game.stats.bestScores[mg.id]" class="card-best num">
          BEST {{ formatNumber(game.stats.bestScores[mg.id]) }}
        </span>
      </RouterLink>
    </div>

    <QuestPanel />
    <RebirthPanel />
  </div>
</template>

<style scoped>
.hub {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

.title {
  font-family: var(--font-display);
  font-size: 26px;
  letter-spacing: 0.12em;
  text-align: center;
}

.accent {
  color: var(--shards);
  text-shadow: var(--glow-md) var(--shards-glow);
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: calc(-1 * var(--space-3));
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-5) var(--space-3);
  text-decoration: none;
  color: var(--text-primary);
  transition: all var(--dur-fast) var(--ease-out-back);
}

.card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), var(--glow-sm) var(--accent);
}

.card:active {
  transform: scale(0.96);
}

.card-icon {
  font-size: 30px;
  color: var(--accent);
  text-shadow: var(--glow-md) var(--accent);
}

.card-name {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.06em;
}

.card-tag {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
}

.card-best {
  margin-top: var(--space-1);
  font-size: 10px;
  color: var(--prestige);
  letter-spacing: 0.1em;
}
</style>
