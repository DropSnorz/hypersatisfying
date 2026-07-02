<script setup>
import { computed } from 'vue'
import { RARITIES } from '../../gacha/itemPool'

const props = defineProps({
  item: { type: Object, required: true },
  revealed: { type: Boolean, default: true },
  big: { type: Boolean, default: false },
})

const rarity = computed(() => RARITIES[props.item.rarity])
</script>

<template>
  <div
    class="card glass"
    :class="[item.rarity, { revealed, big }]"
    :style="{ '--rc': rarity.color }"
  >
    <template v-if="revealed">
      <span class="rarity-label">{{ rarity.label }}</span>
      <span class="item-icon">{{ item.type === 'boost' ? '▲' : '◆' }}</span>
      <span class="item-name">{{ item.name }}</span>
      <span class="item-desc">{{ item.desc }}</span>
    </template>
    <span v-else class="mystery">?</span>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-3);
  aspect-ratio: 3 / 4;
  border-color: var(--rc);
  text-align: center;
  transition: all var(--dur-med) var(--ease-out-back);
}

.card.revealed {
  animation: card-pop var(--dur-med) var(--ease-out-back) both;
}

@keyframes card-pop {
  from {
    opacity: 0;
    transform: scale(0.5) rotateY(90deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotateY(0);
  }
}

.card.rare { box-shadow: var(--glow-sm) rgba(56, 182, 255, 0.4); }
.card.epic { box-shadow: var(--glow-md) rgba(180, 91, 255, 0.5); }
.card.legendary {
  box-shadow: var(--glow-lg) var(--prestige-glow);
  animation: card-pop var(--dur-slow) var(--ease-out-back) both, legendary-pulse 1.6s ease-in-out infinite 0.6s;
}

@keyframes legendary-pulse {
  0%, 100% { box-shadow: var(--glow-md) var(--prestige-glow); }
  50% { box-shadow: var(--glow-lg) var(--prestige-glow), 0 0 80px rgba(255, 200, 61, 0.3); }
}

.rarity-label {
  font-size: 8px;
  letter-spacing: 0.25em;
  color: var(--rc);
  font-weight: 700;
}

.item-icon {
  font-size: 26px;
  color: var(--rc);
  text-shadow: var(--glow-md) var(--rc);
}

.big .item-icon { font-size: 44px; }

.item-name {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.big .item-name { font-size: 15px; }

.item-desc {
  font-size: 9px;
  color: var(--text-secondary);
}

.big .item-desc { font-size: 12px; }

.mystery {
  font-size: 34px;
  color: var(--text-dim);
}
</style>
