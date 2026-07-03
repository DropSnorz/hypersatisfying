import { defineStore } from 'pinia'

export interface GameState {
  dollars: number
  compute: number
  scale: number
  lifetimeDollars: number
  prestige: {
    rebirths: number
    multiplier: number
  }
  stats: {
    gamesPlayed: number
    bestScores: Record<string, number>
  }
}

/**
 * Central currency + progression state. Everything hangs off this.
 * - dollars: soft currency (spendable)
 * - compute: premium currency (earn-only, spendable on premium gacha)
 * - scale: the number that only ever goes up
 */
export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    dollars: 0,
    compute: 0,
    scale: 0,
    lifetimeDollars: 0,
    prestige: {
      rebirths: 0,
      multiplier: 1,
    },
    stats: {
      gamesPlayed: 0,
      bestScores: {},
    },
  }),

  getters: {
    /** Global earn multiplier from prestige (gacha boosts stack in inventoryStore) */
    globalMultiplier: (state) => state.prestige.multiplier,
    canRebirth: (state) => state.scale >= 10000,
  },

  actions: {
    addDollars(amount: number): number {
      const gained = Math.floor(amount)
      this.dollars += gained
      this.lifetimeDollars += gained
      this.scale += gained
      return gained
    },

    addCompute(amount: number): number {
      const gained = Math.floor(amount)
      this.compute += gained
      return gained
    },

    spendDollars(amount: number): boolean {
      if (this.dollars < amount) return false
      this.dollars -= amount
      return true
    },

    spendCompute(amount: number): boolean {
      if (this.compute < amount) return false
      this.compute -= amount
      return true
    },

    recordGame(gameId: string, score: number): boolean {
      this.stats.gamesPlayed++
      const best = this.stats.bestScores[gameId] ?? 0
      const isRecord = score > best
      if (isRecord) this.stats.bestScores[gameId] = score
      return isRecord
    },

    rebirth(): boolean {
      if (!this.canRebirth) return false
      this.dollars = 0
      this.prestige.rebirths++
      // +5% global gain per rebirth, permanent
      this.prestige.multiplier = 1 + this.prestige.rebirths * 0.05
      return true
    },
  },

  persist: true,
})
