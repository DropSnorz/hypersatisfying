import { defineStore } from 'pinia'

/**
 * Daily login rewards with a 7-day cycle and a 48h grace window
 * so a missed timezone boundary doesn't nuke the streak.
 */

export interface DailyReward {
  dollars: number
  compute: number
}

export interface DailyClaimResult extends DailyReward {
  streak: number
}

export const DAILY_CYCLE: DailyReward[] = [
  { dollars: 200, compute: 0 },
  { dollars: 300, compute: 1 },
  { dollars: 400, compute: 1 },
  { dollars: 500, compute: 2 },
  { dollars: 650, compute: 2 },
  { dollars: 800, compute: 3 },
  { dollars: 1000, compute: 8 }, // day 7 jackpot
]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export interface DailyState {
  lastClaimDate: string
  streak: number
  longestStreak: number
}

export const useDailyStore = defineStore('daily', {
  state: (): DailyState => ({
    lastClaimDate: '',
    streak: 0,
    longestStreak: 0,
  }),

  getters: {
    canClaim: (state) => state.lastClaimDate !== todayKey(),
    /** index into DAILY_CYCLE for the NEXT claim */
    cycleIndex: (state) => state.streak % 7,
  },

  actions: {
    /** Claims today's reward. Returns null if already claimed today. */
    claim(): DailyClaimResult | null {
      const today = todayKey()
      if (this.lastClaimDate === today) return null

      const last = this.lastClaimDate ? new Date(this.lastClaimDate) : null
      const gapDays = last ? (new Date(today).getTime() - last.getTime()) / 86400000 : Infinity
      // within 48h keeps the streak; longer resets it
      this.streak = gapDays <= 2 ? this.streak + 1 : 1
      this.longestStreak = Math.max(this.longestStreak, this.streak)
      this.lastClaimDate = today

      const reward = DAILY_CYCLE[(this.streak - 1) % 7]
      return { ...reward, streak: this.streak }
    },
  },

  persist: true,
})
