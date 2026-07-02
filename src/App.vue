<script setup>
import HUD from './components/layout/HUD.vue'
import NavDock from './components/layout/NavDock.vue'
import RewardToast from './components/juice/RewardToast.vue'
import { useSettingsStore } from './stores/settingsStore'

useSettingsStore().applyToEngine()
</script>

<template>
  <div class="app-shell">
    <HUD />
    <main class="app-main">
      <RouterView />
    </main>
    <NavDock />
    <RewardToast />
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
</style>
