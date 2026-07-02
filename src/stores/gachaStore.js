import { defineStore } from 'pinia'
import { createRng, weightedPick } from '../engine/rng'
import { RARITIES, itemsOfRarity } from '../gacha/itemPool'

const rng = createRng()

const SOFT_PITY_START = 40
const HARD_PITY = 50
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export const BANNERS = {
  standard: {
    id: 'standard',
    name: 'STANDARD MATRIX',
    currency: 'shards',
    cost: 150,
    cost10: 1350, // 10% discount on 10-pull
    // base odds straight from RARITIES weights
    oddsBonus: 0,
  },
  premium: {
    id: 'premium',
    name: 'SINGULARITY MATRIX',
    currency: 'cores',
    cost: 10,
    cost10: 90,
    // premium banner shifts weight toward the top tiers
    oddsBonus: 1,
  },
}

function rollRarity(banner, pity) {
  // hard pity: guaranteed epic+ at HARD_PITY
  if (pity >= HARD_PITY - 1) {
    return rng() < 0.2 ? 'legendary' : 'epic'
  }
  const entries = RARITY_ORDER.map((key) => {
    let weight = RARITIES[key].weight
    if (banner.oddsBonus && (key === 'epic' || key === 'legendary')) weight *= 2.5
    if (banner.oddsBonus && key === 'common') weight *= 0.6
    // soft pity: ramp epic/legendary weight from SOFT_PITY_START
    if (pity >= SOFT_PITY_START && (key === 'epic' || key === 'legendary')) {
      weight *= 1 + (pity - SOFT_PITY_START) * 0.8
    }
    return { key, weight }
  })
  return weightedPick(rng, entries).key
}

export const useGachaStore = defineStore('gacha', {
  state: () => ({
    pity: { standard: 0, premium: 0 },
    totalPulls: 0,
    history: [], // last 50: { itemId, rarity, banner, at }
  }),

  actions: {
    /**
     * Resolve `count` pulls on a banner. Pure state change — the
     * caller (GachaScreen) handles currency spend and reveal UI.
     * Returns array of { ...item, isNew }.
     */
    resolvePulls(bannerId, count) {
      const banner = BANNERS[bannerId]
      const results = []
      for (let i = 0; i < count; i++) {
        const rarity = rollRarity(banner, this.pity[bannerId])
        const isEpicPlus = rarity === 'epic' || rarity === 'legendary'
        this.pity[bannerId] = isEpicPlus ? 0 : this.pity[bannerId] + 1
        this.totalPulls++

        const pool = itemsOfRarity(rarity)
        const item = pool[(rng() * pool.length) | 0]
        results.push({ ...item })
        this.history.unshift({ itemId: item.itemId, rarity, banner: bannerId, at: Date.now() })
      }
      if (this.history.length > 50) this.history.length = 50
      return results
    },
  },

  persist: true,
})
