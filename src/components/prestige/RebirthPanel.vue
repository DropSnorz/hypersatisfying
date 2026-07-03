<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useJuice } from '../../composables/useJuice'
import { formatNumber } from '../../engine/numberFormat'
import { sfx } from '../../engine/soundManager'

const REBIRTH_AT = 10000

const game = useGameStore()
const { toast, shakeScreen } = useJuice()
const confirming = ref(false)

function rebirth() {
  if (!game.rebirth()) return
  confirming.value = false
  shakeScreen(600)
  sfx.fanfare()
  toast(`REBIRTH ${game.prestige.rebirths} — earnings ×${game.prestige.multiplier.toFixed(2)}`, { kind: 'record', duration: 4000 })
}
</script>

<template>
  <section class="rebirth glass" :class="{ ready: game.canRebirth }">
    <div class="r-head">
      <h3>REBIRTH PROTOCOL</h3>
      <span v-if="game.prestige.rebirths" class="r-count num">
        ×{{ game.prestige.multiplier.toFixed(2) }} permanent
      </span>
    </div>

    <div class="r-track">
      <div class="r-fill" :style="{ width: `${Math.min(game.scale / REBIRTH_AT, 1) * 100}%` }"></div>
    </div>
    <p class="r-progress num">
      {{ formatNumber(game.scale) }} / {{ formatNumber(REBIRTH_AT) }} SCALE
    </p>

    <template v-if="game.canRebirth">
      <button v-if="!confirming" class="r-btn" @click="confirming = true">
        INITIATE REBIRTH
      </button>
      <div v-else class="r-confirm">
        <p>Dollars reset to 0. Collection, Compute &amp; streaks survive.<br />Permanent +5% earnings. Forever.</p>
        <div class="r-actions">
          <button class="r-btn danger" @click="rebirth">CONFIRM</button>
          <button class="r-cancel" @click="confirming = false">ABORT</button>
        </div>
      </div>
    </template>
    <p v-else class="r-hint">Reach {{ formatNumber(REBIRTH_AT) }} Scale to unlock a permanent multiplier.</p>
  </section>
</template>

<style scoped>
.rebirth {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rebirth.ready {
  border-color: var(--prestige);
  box-shadow: var(--glow-sm) var(--prestige-glow);
}

.r-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

h3 {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--prestige);
}

.r-count {
  font-size: 11px;
  color: var(--prestige);
}

.r-track {
  height: 7px;
  border-radius: var(--radius-full);
  background: rgba(255, 200, 61, 0.1);
  overflow: hidden;
}

.r-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--prestige), #ff8a5b);
  box-shadow: var(--glow-sm) var(--prestige-glow);
  border-radius: var(--radius-full);
  transition: width var(--dur-med) var(--ease-out-quint);
}

.r-progress {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
}

.r-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

.r-btn {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.15em;
  color: var(--bg-deep);
  background: var(--prestige);
  box-shadow: var(--glow-md) var(--prestige-glow);
  animation: throb 1.4s ease-in-out infinite;
}

.r-btn.danger {
  background: var(--danger);
  box-shadow: var(--glow-md) rgba(255, 84, 112, 0.5);
  animation: none;
}

@keyframes throb {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.r-confirm p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  text-align: center;
}

.r-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.r-actions {
  display: flex;
  gap: var(--space-3);
}

.r-actions > * {
  flex: 1;
}

.r-cancel {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-border-bright);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.15em;
}
</style>
