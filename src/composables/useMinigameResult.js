import { useGameStore } from '../stores/gameStore'
import { useInventoryStore } from '../stores/inventoryStore'
import { useQuestStore } from '../stores/questStore'
import { useJuice } from './useJuice'
import { getGame } from '../minigames/registry'
import { formatNumber } from '../engine/numberFormat'
import { sfx } from '../engine/soundManager'

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

  const reportResult = ({ gameId, score, stats = {} }) => {
    const def = getGame(gameId)
    const base = def?.rewardCurve(score, stats) ?? { shards: Math.floor(score), cores: 0 }

    const multiplier = game.globalMultiplier * inventory.boostMultiplier
    const shards = Math.floor(base.shards * multiplier)
    const cores = Math.floor(base.cores)

    game.addShards(shards)
    if (cores > 0) game.addCores(cores)
    const isRecord = game.recordGame(gameId, score)

    quests.notifyEvent({ type: 'playCount', gameId })
    quests.notifyEvent({ type: 'currencyEarned', gameId, amount: shards })
    quests.notifyEvent({ type: 'scoreThreshold', gameId, amount: score })

    sfx.coin()
    toast(`+${formatNumber(shards)} Shards`, { kind: 'shards' })
    if (cores > 0) toast(`+${formatNumber(cores)} Cores`, { kind: 'cores' })
    if (isRecord && score > 0) {
      sfx.fanfare()
      toast('New personal best!', { kind: 'record' })
    }

    return { shards, cores, isRecord, multiplier }
  }

  return { reportResult }
}
