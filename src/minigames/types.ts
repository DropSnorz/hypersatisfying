import type { Component } from 'vue'

export type MinigameId = 'bubble-pop' | 'load-balancer' | 'eviction-scheduler' | 'slice-reflex' | 'pattern-match'

/** Union of every stat any minigame might report; each game only sets its own subset. */
export interface MinigameStats {
  goldenPops?: number
  bestStreak?: number
  perfectEvictions?: number
  multiSlices?: number
}

export interface MinigameReward {
  dollars: number
  compute: number
}

export interface MinigameDef {
  id: MinigameId
  name: string
  tagline: string
  icon: string
  accent: string
  component: Component
  free: boolean
  rewardCurve: (score: number, stats: MinigameStats) => MinigameReward
}
