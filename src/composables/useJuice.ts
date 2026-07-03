import { reactive } from 'vue'

/**
 * App-wide juice bus: toast queue + DOM screen shake.
 * Canvas-level effects (particles, canvas shake) live inside each
 * minigame; this handles the shared DOM/UI layer.
 */

export type ToastKind = 'reward' | 'shards' | 'cores' | 'record' | 'error'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
}

export interface ToastOptions {
  kind?: ToastKind
  duration?: number
}

interface JuiceState {
  toasts: Toast[]
  shaking: boolean
}

let toastId = 0

const juiceState: JuiceState = reactive({
  toasts: [],
  shaking: false,
})

export function useJuice() {
  const toast = (message: string, { kind = 'reward', duration = 2200 }: ToastOptions = {}) => {
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
