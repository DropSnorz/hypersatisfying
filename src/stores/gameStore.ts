import { defineStore } from 'pinia'

export interface GameState {
  shards: number
  cores: number
  mastery: number
  lifetimeShards: number
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
 * - shards: soft currency (spendable)
 * - cores: premium currency (earn-only, spendable on premium gacha)
 * - mastery: the number that only ever goes up
 */
export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    shards: 0,
    cores: 0,
    mastery: 0,
    lifetimeShards: 0,
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
    canRebirth: (state) => state.mastery >= 10000,
  },

  actions: {
    addShards(amount: number): number {
      const gained = Math.floor(amount)
      this.shards += gained
      this.lifetimeShards += gained
      this.mastery += gained
      return gained
    },

    addCores(amount: number): number {
      const gained = Math.floor(amount)
      this.cores += gained
      return gained
    },

    spendShards(amount: number): boolean {
      if (this.shards < amount) return false
      this.shards -= amount
      return true
    },

    spendCores(amount: number): boolean {
      if (this.cores < amount) return false
      this.cores -= amount
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
      this.shards = 0
      this.prestige.rebirths++
      // +5% global gain per rebirth, permanent
      this.prestige.multiplier = 1 + this.prestige.rebirths * 0.05
      return true
    },
  },

  persist: true,
})
