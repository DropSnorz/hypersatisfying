import { defineStore } from 'pinia'
import type { GachaItem, RarityKey } from '../gacha/itemPool'

export interface OwnedItem extends GachaItem {
  obtainedAt: number
}

export interface InventoryState {
  items: OwnedItem[]
  equippedSkins: Record<string, string>
}

/**
 * Gacha-earned items: cosmetics and passive multiplier boosts.
 * Boost multipliers are small and capped so playtime dominates output.
 */
const BOOST_CAP = 1.5

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    items: [],
    equippedSkins: {},
  }),

  getters: {
    /** Combined passive earn multiplier from all owned boost items, capped */
    boostMultiplier: (state): number => {
      const total = state.items
        .filter((i) => i.type === 'boost')
        .reduce((mult, i) => mult + (i.boost ?? 0), 1)
      return Math.min(total, BOOST_CAP)
    },
    countByRarity: (state): Record<string, number> => {
      const counts: Partial<Record<RarityKey, number>> = {}
      for (const item of state.items) counts[item.rarity] = (counts[item.rarity] ?? 0) + 1
      return counts
    },
  },

  actions: {
    addItem(item: GachaItem) {
      this.items.push({ ...item, obtainedAt: Date.now() })
    },
  },

  persist: true,
})
