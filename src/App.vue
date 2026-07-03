<script setup lang="ts">
import HUD from './components/layout/HUD.vue'
import NavDock from './components/layout/NavDock.vue'
import RewardToast from './components/juice/RewardToast.vue'
import DailyRewardModal from './components/daily/DailyRewardModal.vue'
import { useSettingsStore } from './stores/settingsStore'
import { useJuice } from './composables/useJuice'

useSettingsStore().applyToEngine()
const { juiceState } = useJuice()
</script>

<template>
  <div class="app-shell" :class="{ shaking: juiceState.shaking }">
    <HUD />
    <main class="app-main">
      <RouterView />
    </main>
    <NavDock />
    <RewardToast />
    <DailyRewardModal />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.app-shell.shaking {
  animation: dom-shake 0.5s linear;
}

@keyframes dom-shake {
  0%, 100% { transform: translate(0, 0); }
  15% { transform: translate(-7px, 4px); }
  30% { transform: translate(6px, -5px); }
  45% { transform: translate(-5px, -3px); }
  60% { transform: translate(4px, 5px); }
  75% { transform: translate(-3px, 2px); }
  90% { transform: translate(2px, -2px); }
}
</style>
