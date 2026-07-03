<script setup lang="ts">
import { computed } from 'vue'
import { getGame } from '../../minigames/registry'

const props = defineProps<{ gameId: string }>()
const def = computed(() => getGame(props.gameId))
</script>

<template>
  <div v-if="def" class="host">
    <div class="host-bar">
      <RouterLink to="/" class="back glass">← Hub</RouterLink>
      <h2 class="name">{{ def.name }}</h2>
    </div>
    <component :is="def.component" />
  </div>
  <div v-else class="missing">
    <p>Unknown game.</p>
    <RouterLink to="/">Back to hub</RouterLink>
  </div>
</template>

<style scoped>
.host {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
}

.host-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.back {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
}

.name {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.08em;
}

.missing {
  text-align: center;
  padding-top: var(--space-7);
  color: var(--text-secondary);
}
</style>
