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
  {
    id: 'rhythm-bar',
    name: 'Rhythm Bar',
    tagline: 'Nail the perfect timing window',
    icon: '⏸',
    accent: 'var(--prestige)',
    component: defineAsyncComponent(() => import('./RhythmBar.vue')),
    free: true,
    rewardCurve: (score, stats) => ({
      shards: score * 3,
      cores: Math.floor((stats.bestStreak ?? 0) / 10),
    }),
  },
  {
    id: 'slice-reflex',
    name: 'Slice Reflex',
    tagline: 'Slice everything. Avoid the mines.',
    icon: '⌁',
    accent: 'var(--success)',
    component: defineAsyncComponent(() => import('./SliceReflex.vue')),
    free: true,
    rewardCurve: (score, stats) => ({
      shards: score * 2.5,
      cores: stats.multiSlices ?? 0,
    }),
  },
  {
    id: 'pattern-match',
    name: 'Pattern Match',
    tagline: 'Memorize. Repeat. Survive.',
    icon: '⊞',
    accent: 'var(--mastery)',
    component: defineAsyncComponent(() => import('./PatternMatch.vue')),
    free: true,
    rewardCurve: (score) => ({
      // superlinear per round survived — encourages "one more try"
      shards: Math.floor(Math.pow(score, 1.6) * 10),
      cores: score >= 8 ? Math.floor(score / 4) : 0,
    }),
  },
  // Phase 4+: MergeOrbs, IdleBurstClicker (gacha-unlockable)
]

export function getGame(gameId) {
  return MINIGAMES.find((g) => g.id === gameId)
}
