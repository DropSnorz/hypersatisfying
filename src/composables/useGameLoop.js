import { onMounted, onUnmounted, ref } from 'vue'
import { GameLoop } from '../engine/GameLoop'

/**
 * Vue-lifecycle-bound GameLoop: starts on mount, tears down on unmount.
 * The callback receives (dt, time) each frame.
 */
export function useGameLoop(callback, { autoStart = true } = {}) {
  const isRunning = ref(false)
  const loop = new GameLoop(callback)

  const start = () => {
    loop.start()
    isRunning.value = true
  }
  const stop = () => {
    loop.stop()
    isRunning.value = false
  }

  onMounted(() => {
    if (autoStart) start()
  })
  onUnmounted(stop)

  return {
    isRunning,
    start,
    stop,
    pause: () => loop.pause(),
    resume: () => loop.resume(),
  }
}
