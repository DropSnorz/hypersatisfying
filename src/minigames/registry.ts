import { defineAsyncComponent } from 'vue'
import type { MinigameDef, MinigameId } from './types'

/**
 * Central manifest for the minigame roster: metadata, reward curves,
 * and unlock gating in one place so balance tuning never touches
 * game logic.
 */
export const MINIGAMES: MinigameDef[] = [
  {
    id: 'bubble-pop',
    name: 'Bubble Pop',
    tagline: 'Pop matching clusters before time runs out',
    icon: '◉',
    accent: 'var(--dollars)',
    component: defineAsyncComponent(() => import('./BubblePop.vue')),
    free: true,
    rewardCurve: (score, stats) => ({
      dollars: score * 2,
      compute: stats.goldenPops ? stats.goldenPops * 2 : 0,
    }),
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer',
    tagline: 'Dispatch on the drifting balance point',
    icon: '⇌',
    accent: 'var(--prestige)',
    component: defineAsyncComponent(() => import('./LoadBalancer.vue')),
    free: true,
    rewardCurve: (score, stats) => ({
      dollars: score * 3,
      compute: Math.floor((stats.bestStreak ?? 0) / 10),
    }),
  },
  {
    id: 'eviction-scheduler',
    name: 'Eviction Scheduler',
    tagline: 'Evict the hottest rack at the perfect time',
    icon: '⏏',
    accent: 'var(--danger)',
    component: defineAsyncComponent(() => import('./EvictionScheduler.vue')),
    free: true,
    rewardCurve: (score, stats) => ({
      dollars: score * 3,
      compute: Math.floor((stats.perfectEvictions ?? 0) / 8),
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
      dollars: score * 2.5,
      compute: stats.multiSlices ?? 0,
    }),
  },
  {
    id: 'pattern-match',
    name: 'Pattern Match',
    tagline: 'Memorize. Repeat. Survive.',
    icon: '⊞',
    accent: 'var(--scale)',
    component: defineAsyncComponent(() => import('./PatternMatch.vue')),
    free: true,
    rewardCurve: (score) => ({
      // superlinear per round survived — encourages "one more try"
      dollars: Math.floor(Math.pow(score, 1.6) * 10),
      compute: score >= 8 ? Math.floor(score / 4) : 0,
    }),
  },
  // Phase 4+: MergeOrbs, IdleBurstClicker (gacha-unlockable)
]

export function getGame(gameId: MinigameId | string): MinigameDef | undefined {
  return MINIGAMES.find((g) => g.id === gameId)
}
