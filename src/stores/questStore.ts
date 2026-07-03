import { defineStore } from 'pinia'
import { MINIGAMES } from '../minigames/registry'
import type { MinigameId } from '../minigames/types'

/**
 * Rotating daily quests. Progress events flow in from
 * useMinigameResult (play/score/earn) and GachaScreen (pulls),
 * so quest logic lives in exactly one place.
 */

export type QuestType = 'playCount' | 'currencyEarned' | 'gachaPulls' | 'scoreThreshold'
export type QuestGameId = MinigameId | 'any'

export interface QuestReward {
  shards: number
  cores: number
}

export interface QuestTemplate {
  type: QuestType
  target: number
  gameId: QuestGameId
  desc: string
  reward: QuestReward
}

export interface Quest extends QuestTemplate {
  id: string
  progress: number
  claimed: boolean
}

export interface QuestEvent {
  type: QuestType
  gameId?: string
  amount?: number
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  { type: 'playCount', target: 3, gameId: 'any', desc: 'Play 3 rounds of anything', reward: { shards: 300, cores: 0 } },
  { type: 'playCount', target: 5, gameId: 'any', desc: 'Play 5 rounds of anything', reward: { shards: 500, cores: 2 } },
  { type: 'currencyEarned', target: 500, gameId: 'any', desc: 'Earn 500 Shards from minigames', reward: { shards: 250, cores: 1 } },
  { type: 'currencyEarned', target: 1500, gameId: 'any', desc: 'Earn 1.5K Shards from minigames', reward: { shards: 600, cores: 3 } },
  { type: 'gachaPulls', target: 3, gameId: 'any', desc: 'Pull the gacha 3 times', reward: { shards: 400, cores: 1 } },
  { type: 'playCount', target: 2, gameId: 'bubble-pop', desc: 'Play Bubble Pop twice', reward: { shards: 350, cores: 1 } },
  { type: 'playCount', target: 2, gameId: 'rhythm-bar', desc: 'Play Rhythm Bar twice', reward: { shards: 350, cores: 1 } },
  { type: 'playCount', target: 2, gameId: 'slice-reflex', desc: 'Play Slice Reflex twice', reward: { shards: 350, cores: 1 } },
  { type: 'playCount', target: 2, gameId: 'pattern-match', desc: 'Play Pattern Match twice', reward: { shards: 350, cores: 1 } },
  { type: 'scoreThreshold', target: 50, gameId: 'any', desc: 'Score 50+ in a single round', reward: { shards: 450, cores: 2 } },
]

export interface QuestState {
  day: string
  active: Quest[]
}

export const useQuestStore = defineStore('quests', {
  state: (): QuestState => ({
    day: '',
    active: [],
  }),

  getters: {
    claimable: (state) => state.active.filter((q) => !q.claimed && q.progress >= q.target).length,
  },

  actions: {
    /** Roll 3 fresh quests if the calendar day changed. */
    refreshIfStale() {
      const today = todayKey()
      if (this.day === today && this.active.length) return
      this.day = today
      // deterministic-ish daily selection: seed by date so all
      // reloads on the same day agree
      let seed = [...today].reduce((a, c) => a + c.charCodeAt(0), 0)
      const picks: QuestTemplate[] = []
      const pool = [...QUEST_TEMPLATES]
      // keep game-specific quests only for games that exist
      const valid = pool.filter((q) => q.gameId === 'any' || MINIGAMES.some((g) => g.id === q.gameId))
      for (let i = 0; i < 3 && valid.length; i++) {
        seed = (seed * 9301 + 49297) % 233280
        const idx = seed % valid.length
        picks.push(valid.splice(idx, 1)[0])
      }
      this.active = picks.map((t, i) => ({
        id: `${today}-${i}`,
        ...t,
        progress: 0,
        claimed: false,
      }))
    },

    notifyEvent(event: QuestEvent) {
      for (const q of this.active) {
        if (q.claimed || q.type !== event.type) continue
        if (q.gameId !== 'any' && q.gameId !== event.gameId) continue
        if (q.type === 'scoreThreshold') {
          // threshold quests complete in one qualifying round
          if ((event.amount ?? 0) >= q.target) q.progress = q.target
        } else {
          q.progress = Math.min(q.progress + (event.amount ?? 1), q.target)
        }
      }
    },

    /** Returns the reward if claim succeeded, null otherwise. */
    claim(questId: string): QuestReward | null {
      const q = this.active.find((x) => x.id === questId)
      if (!q || q.claimed || q.progress < q.target) return null
      q.claimed = true
      return q.reward
    },
  },

  persist: true,
})
