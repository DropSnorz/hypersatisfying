<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useSettingsStore } from '../../stores/settingsStore'

const route = useRoute()
const settings = useSettingsStore()
</script>

<template>
  <nav class="dock glass">
    <RouterLink to="/" class="dock-btn" :class="{ active: route.name === 'hub' }">
      <span class="icon">⌂</span>
      <span class="txt">Hub</span>
    </RouterLink>
    <RouterLink to="/gacha" class="dock-btn" :class="{ active: route.name === 'gacha' }">
      <span class="icon">◈</span>
      <span class="txt">Gacha</span>
    </RouterLink>
    <button class="dock-btn" @click="settings.toggleSound()">
      <span class="icon">{{ settings.soundOn ? '♪' : '∅' }}</span>
      <span class="txt">Sound</span>
    </button>
  </nav>
</template>

<style scoped>
.dock {
  display: flex;
  justify-content: space-around;
  margin: 0 var(--space-4) var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-full);
}

.dock-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--dur-fast) var(--ease-out-quint);
}

.dock-btn.active {
  color: var(--shards);
  background: rgba(56, 214, 255, 0.1);
  box-shadow: inset 0 0 12px rgba(56, 214, 255, 0.08);
}

.dock-btn:active {
  transform: scale(0.92);
}

.icon {
  font-size: 18px;
}

.txt {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
