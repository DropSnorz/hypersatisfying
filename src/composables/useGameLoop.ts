import { onMounted, onUnmounted, ref } from 'vue'
import { GameLoop, type GameLoopCallback } from '../engine/GameLoop'

export interface UseGameLoopOptions {
  autoStart?: boolean
}

/**
 * Vue-lifecycle-bound GameLoop: starts on mount, tears down on unmount.
 * The callback receives (dt, time) each frame.
 */
export function useGameLoop(callback: GameLoopCallback, { autoStart = true }: UseGameLoopOptions = {}) {
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
