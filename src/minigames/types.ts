import type { Component } from 'vue'

export type MinigameId = 'bubble-pop' | 'rhythm-bar' | 'slice-reflex' | 'pattern-match'

/** Union of every stat any minigame might report; each game only sets its own subset. */
export interface MinigameStats {
  goldenPops?: number
  bestStreak?: number
  multiSlices?: number
}

export interface MinigameReward {
  shards: number
  cores: number
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
