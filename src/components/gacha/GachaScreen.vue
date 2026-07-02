<script setup>
// Phase 2: banners, pulls, pity display land here.
</script>

<template>
  <div class="gacha-placeholder glass">
    <span class="icon">◈</span>
    <h2>GACHA CHAMBER</h2>
    <p>Calibrating probability matrix…</p>
    <p class="soon">Coming in Phase 2</p>
  </div>
</template>

<style scoped>
.gacha-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-4);
  margin-top: var(--space-6);
  text-align: center;
}

.icon {
  font-size: 44px;
  color: var(--cores);
  text-shadow: var(--glow-lg) var(--cores-glow);
  animation: pulse 2s ease-in-out infinite;
}

h2 {
  font-family: var(--font-display);
  letter-spacing: 0.15em;
  font-size: 18px;
}

p {
  color: var(--text-secondary);
  font-size: 13px;
}

.soon {
  color: var(--text-dim);
  font-size: 11px;
  letter-spacing: 0.1em;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.12); opacity: 1; }
}
</style>
