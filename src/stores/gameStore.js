import { defineStore } from 'pinia'

/**
 * Central currency + progression state. Everything hangs off this.
 * - shards: soft currency (spendable)
 * - cores: premium currency (earn-only, spendable on premium gacha)
 * - mastery: the number that only ever goes up
 */
export const useGameStore = defineStore('game', {
  state: () => ({
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
      bestScores: {}, // gameId -> best score
    },
  }),

  getters: {
    /** Global earn multiplier from prestige (gacha boosts stack in inventoryStore) */
    globalMultiplier: (state) => state.prestige.multiplier,
    canRebirth: (state) => state.mastery >= 10000,
  },

  actions: {
    addShards(amount) {
      const gained = Math.floor(amount)
      this.shards += gained
      this.lifetimeShards += gained
      this.mastery += gained
      return gained
    },

    addCores(amount) {
      const gained = Math.floor(amount)
      this.cores += gained
      return gained
    },

    spendShards(amount) {
      if (this.shards < amount) return false
      this.shards -= amount
      return true
    },

    spendCores(amount) {
      if (this.cores < amount) return false
      this.cores -= amount
      return true
    },

    recordGame(gameId, score) {
      this.stats.gamesPlayed++
      const best = this.stats.bestScores[gameId] ?? 0
      const isRecord = score > best
      if (isRecord) this.stats.bestScores[gameId] = score
      return isRecord
    },

    rebirth() {
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
