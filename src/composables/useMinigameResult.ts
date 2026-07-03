import { useGameStore } from '../stores/gameStore'
import { useInventoryStore } from '../stores/inventoryStore'
import { useQuestStore } from '../stores/questStore'
import { useJuice } from './useJuice'
import { getGame } from '../minigames/registry'
import type { MinigameId, MinigameStats } from '../minigames/types'
import { formatNumber } from '../engine/numberFormat'
import { sfx } from '../engine/soundManager'

export interface MinigameResultInput {
  gameId: MinigameId
  score: number
  stats?: MinigameStats
}

export interface MinigameResult {
  dollars: number
  compute: number
  isRecord: boolean
  multiplier: number
}

/**
 * The single funnel every minigame reports through:
 * score -> rewardCurve -> multipliers -> store commit -> juice.
 * Returns the final reward so the game-over screen can display it.
 */
export function useMinigameResult() {
  const game = useGameStore()
  const inventory = useInventoryStore()
  const quests = useQuestStore()
  const { toast } = useJuice()

  const reportResult = ({ gameId, score, stats = {} }: MinigameResultInput): MinigameResult => {
    const def = getGame(gameId)
    const base = def?.rewardCurve(score, stats) ?? { dollars: Math.floor(score), compute: 0 }

    const multiplier = game.globalMultiplier * inventory.boostMultiplier
    const dollars = Math.floor(base.dollars * multiplier)
    const compute = Math.floor(base.compute)

    game.addDollars(dollars)
    if (compute > 0) game.addCompute(compute)
    const isRecord = game.recordGame(gameId, score)

    quests.notifyEvent({ type: 'playCount', gameId })
    quests.notifyEvent({ type: 'currencyEarned', gameId, amount: dollars })
    quests.notifyEvent({ type: 'scoreThreshold', gameId, amount: score })

    sfx.coin()
    toast(`+$${formatNumber(dollars)}`, { kind: 'dollars' })
    if (compute > 0) toast(`+${formatNumber(compute)} Compute`, { kind: 'compute' })
    if (isRecord && score > 0) {
      sfx.fanfare()
      toast('New personal best!', { kind: 'record' })
    }

    return { dollars, compute, isRecord, multiplier }
  }

  return { reportResult }
}
