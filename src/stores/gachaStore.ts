import { defineStore } from 'pinia'
import { createRng, weightedPick } from '../engine/rng'
import { RARITIES, itemsOfRarity, type GachaItem, type RarityKey } from '../gacha/itemPool'

const rng = createRng()

const SOFT_PITY_START = 40
const HARD_PITY = 50
const RARITY_ORDER: RarityKey[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export type BannerId = 'standard' | 'premium'

export interface Banner {
  id: BannerId
  name: string
  currency: 'dollars' | 'compute'
  cost: number
  cost10: number
  oddsBonus: number
}

export const BANNERS: Record<BannerId, Banner> = {
  standard: {
    id: 'standard',
    name: 'STANDARD MATRIX',
    currency: 'dollars',
    cost: 150,
    cost10: 1350, // 10% discount on 10-pull
    // base odds straight from RARITIES weights
    oddsBonus: 0,
  },
  premium: {
    id: 'premium',
    name: 'SINGULARITY MATRIX',
    currency: 'compute',
    cost: 10,
    cost10: 90,
    // premium banner shifts weight toward the top tiers
    oddsBonus: 1,
  },
}

function rollRarity(banner: Banner, pity: number): RarityKey {
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

export interface PullHistoryEntry {
  itemId: string
  rarity: RarityKey
  banner: BannerId
  at: number
}

export interface GachaState {
  pity: Record<BannerId, number>
  totalPulls: number
  history: PullHistoryEntry[]
}

export const useGachaStore = defineStore('gacha', {
  state: (): GachaState => ({
    pity: { standard: 0, premium: 0 },
    totalPulls: 0,
    history: [],
  }),

  actions: {
    /**
     * Resolve `count` pulls on a banner. Pure state change — the
     * caller (GachaScreen) handles currency spend and reveal UI.
     */
    resolvePulls(bannerId: BannerId, count: number): GachaItem[] {
      const banner = BANNERS[bannerId]
      const results: GachaItem[] = []
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
