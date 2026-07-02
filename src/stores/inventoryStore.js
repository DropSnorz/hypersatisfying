import { defineStore } from 'pinia'

/**
 * Gacha-earned items: cosmetics and passive multiplier boosts.
 * Boost multipliers are small and capped so playtime dominates output.
 */
const BOOST_CAP = 1.5

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [], // { id, itemId, name, rarity, type: 'cosmetic'|'boost', boost?, obtainedAt }
    equippedSkins: {}, // gameId -> itemId
  }),

  getters: {
    /** Combined passive earn multiplier from all owned boost items, capped */
    boostMultiplier: (state) => {
      const total = state.items
        .filter((i) => i.type === 'boost')
        .reduce((mult, i) => mult + (i.boost ?? 0), 1)
      return Math.min(total, BOOST_CAP)
    },
    countByRarity: (state) => {
      const counts = {}
      for (const item of state.items) counts[item.rarity] = (counts[item.rarity] ?? 0) + 1
      return counts
    },
  },

  actions: {
    addItem(item) {
      this.items.push({ ...item, obtainedAt: Date.now() })
    },
  },

  persist: true,
})
