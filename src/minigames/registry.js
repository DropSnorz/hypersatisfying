import { defineAsyncComponent } from 'vue'

/**
 * Central manifest for the minigame roster: metadata, reward curves,
 * and unlock gating in one place so balance tuning never touches
 * game logic.
 */
export const MINIGAMES = [
  {
    id: 'bubble-pop',
    name: 'Bubble Pop',
    tagline: 'Pop matching clusters before time runs out',
    icon: '◉',
    accent: 'var(--shards)',
    component: defineAsyncComponent(() => import('./BubblePop.vue')),
    free: true,
    rewardCurve: (score, stats) => ({
      shards: score * 2,
      cores: stats.goldenPops ? stats.goldenPops * 2 : 0,
    }),
  },
  // Phase 3: RhythmBar, SliceReflex, PatternMatch, MergeOrbs, IdleBurstClicker
]

export function getGame(gameId) {
  return MINIGAMES.find((g) => g.id === gameId)
}
