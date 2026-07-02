/**
 * Seeded PRNG (mulberry32) so gacha resolution is deterministic
 * under a known seed (testing) while wall-clock seeded in production.
 */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick a weighted option: entries of shape { weight, ...rest } */
export function weightedPick(rng, entries) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0)
  let roll = rng() * total
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return entries[entries.length - 1]
}
