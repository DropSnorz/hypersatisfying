/**
 * The full gacha item pool. Boost values are small and the combined
 * boost is capped in inventoryStore so playtime always dominates.
 */
export const RARITIES = {
  common: { key: 'common', label: 'STANDARD', color: 'var(--rarity-common)', hex: '#a8b4c8', weight: 60 },
  uncommon: { key: 'uncommon', label: 'ENHANCED', color: 'var(--rarity-uncommon)', hex: '#4ade80', weight: 25 },
  rare: { key: 'rare', label: 'PRIME', color: 'var(--rarity-rare)', hex: '#38b6ff', weight: 10 },
  epic: { key: 'epic', label: 'HYPER', color: 'var(--rarity-epic)', hex: '#b45bff', weight: 4 },
  legendary: { key: 'legendary', label: 'SINGULARITY', color: 'var(--rarity-legendary)', hex: '#ffc83d', weight: 1 },
}

export const ITEM_POOL = [
  // --- common ---
  { itemId: 'chip-blue', name: 'Blue Chip', rarity: 'common', type: 'cosmetic', desc: 'A humble data chip.' },
  { itemId: 'chip-gray', name: 'Gray Chip', rarity: 'common', type: 'cosmetic', desc: 'Standard issue silicon.' },
  { itemId: 'bolt-mini', name: 'Micro Bolt', rarity: 'common', type: 'boost', boost: 0.01, desc: '+1% earnings.' },
  { itemId: 'lens-dull', name: 'Dull Lens', rarity: 'common', type: 'cosmetic', desc: 'Sees very little.' },
  // --- uncommon ---
  { itemId: 'coil-green', name: 'Verdant Coil', rarity: 'uncommon', type: 'boost', boost: 0.02, desc: '+2% earnings.' },
  { itemId: 'shard-cluster', name: 'Shard Cluster', rarity: 'uncommon', type: 'cosmetic', desc: 'Pretty and pointy.' },
  { itemId: 'servo-swift', name: 'Swift Servo', rarity: 'uncommon', type: 'boost', boost: 0.02, desc: '+2% earnings.' },
  // --- rare ---
  { itemId: 'prism-azure', name: 'Azure Prism', rarity: 'rare', type: 'boost', boost: 0.05, desc: '+5% earnings.' },
  { itemId: 'core-frag', name: 'Core Fragment', rarity: 'rare', type: 'cosmetic', desc: 'A sliver of something vast.' },
  { itemId: 'gyro-prime', name: 'Prime Gyro', rarity: 'rare', type: 'boost', boost: 0.05, desc: '+5% earnings.' },
  // --- epic ---
  { itemId: 'reactor-violet', name: 'Violet Reactor', rarity: 'epic', type: 'boost', boost: 0.1, desc: '+10% earnings.' },
  { itemId: 'halo-hyper', name: 'Hyper Halo', rarity: 'epic', type: 'cosmetic', desc: 'It hums when you look away.' },
  // --- legendary ---
  { itemId: 'singularity-seed', name: 'Singularity Seed', rarity: 'legendary', type: 'boost', boost: 0.2, desc: '+20% earnings.' },
  { itemId: 'crown-infinite', name: 'Infinite Crown', rarity: 'legendary', type: 'cosmetic', desc: 'Worn by no one, ever.' },
]

export function itemsOfRarity(rarity) {
  return ITEM_POOL.filter((i) => i.rarity === rarity)
}
