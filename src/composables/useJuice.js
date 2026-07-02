import { reactive } from 'vue'

/**
 * App-wide juice bus: toast queue + DOM screen shake.
 * Canvas-level effects (particles, canvas shake) live inside each
 * minigame; this handles the shared DOM/UI layer.
 */

let toastId = 0

const juiceState = reactive({
  toasts: [], // { id, message, kind }
  shaking: false,
})

export function useJuice() {
  const toast = (message, { kind = 'reward', duration = 2200 } = {}) => {
    const id = ++toastId
    juiceState.toasts.push({ id, message, kind })
    setTimeout(() => {
      const idx = juiceState.toasts.findIndex((t) => t.id === id)
      if (idx !== -1) juiceState.toasts.splice(idx, 1)
    }, duration)
  }

  const shakeScreen = (duration = 300) => {
    juiceState.shaking = true
    setTimeout(() => {
      juiceState.shaking = false
    }, duration)
  }

  return { juiceState, toast, shakeScreen }
}
