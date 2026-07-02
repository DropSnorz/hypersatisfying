<script setup>
import { useJuice } from '../../composables/useJuice'

const { juiceState } = useJuice()
</script>

<template>
  <div class="toast-stack">
    <TransitionGroup name="toast">
      <div
        v-for="t in juiceState.toasts"
        :key="t.id"
        class="toast glass num"
        :class="t.kind"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  z-index: 100;
  pointer-events: none;
}

.toast {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 14px;
}

.toast.shards {
  color: var(--shards);
  border-color: var(--shards);
  box-shadow: var(--glow-sm) var(--shards-glow);
}

.toast.cores {
  color: var(--cores);
  border-color: var(--cores);
  box-shadow: var(--glow-sm) var(--cores-glow);
}

.toast.record {
  color: var(--prestige);
  border-color: var(--prestige);
  box-shadow: var(--glow-md) var(--prestige-glow);
}

.toast-enter-active {
  transition: all var(--dur-med) var(--ease-out-back);
}

.toast-leave-active {
  transition: all var(--dur-med) ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.6);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.85);
}
</style>
