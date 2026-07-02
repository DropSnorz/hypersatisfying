<script setup>
import { ref } from 'vue'
import PullReveal from './PullReveal.vue'
import { useGameStore } from '../../stores/gameStore'
import { useGachaStore, BANNERS } from '../../stores/gachaStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useJuice } from '../../composables/useJuice'
import { formatNumber } from '../../engine/numberFormat'
import { sfx } from '../../engine/soundManager'

const game = useGameStore()
const gacha = useGachaStore()
const inventory = useInventoryStore()
const { toast } = useJuice()

const pending = ref(null) // results awaiting reveal

function pull(bannerId, count) {
  const banner = BANNERS[bannerId]
  const cost = count === 10 ? banner.cost10 : banner.cost * count
  const paid = banner.currency === 'shards' ? game.spendShards(cost) : game.spendCores(cost)
  if (!paid) {
    sfx.error()
    toast(`Not enough ${banner.currency === 'shards' ? 'Shards' : 'Cores'}`, { kind: 'error' })
    return
  }
  pending.value = gacha.resolvePulls(bannerId, count)
}

function collect() {
  for (const item of pending.value) {
    inventory.addItem(item)
  }
  toast(`+${pending.value.length} item${pending.value.length > 1 ? 's' : ''} collected`, { kind: 'record' })
  pending.value = null
}
</script>

<template>
  <div class="gacha">
    <h2 class="screen-title">GACHA CHAMBER</h2>

    <div
      v-for="banner in BANNERS"
      :key="banner.id"
      class="banner glass"
      :class="banner.id"
    >
      <div class="banner-head">
        <h3>{{ banner.name }}</h3>
        <span class="pity num">PITY {{ gacha.pity[banner.id] }}/50</span>
      </div>
      <p class="banner-sub">
        {{ banner.id === 'premium' ? 'Boosted Hyper & Singularity odds' : 'Standard odds. Guaranteed Hyper+ at 50.' }}
      </p>
      <div class="pull-row">
        <button class="pull-btn" @click="pull(banner.id, 1)">
          PULL ×1
          <span class="cost num" :class="banner.currency">{{ formatNumber(banner.cost) }}</span>
        </button>
        <button class="pull-btn ten" @click="pull(banner.id, 10)">
          PULL ×10
          <span class="cost num" :class="banner.currency">{{ formatNumber(banner.cost10) }}</span>
        </button>
      </div>
    </div>

    <div class="collection glass">
      <div class="col-head">
        <h3>COLLECTION</h3>
        <span class="num boost">EARN BONUS ×{{ inventory.boostMultiplier.toFixed(2) }}</span>
      </div>
      <p v-if="!inventory.items.length" class="empty">Nothing yet. Feed the matrix.</p>
      <div v-else class="col-grid">
        <span
          v-for="(item, i) in inventory.items.slice().reverse().slice(0, 24)"
          :key="i"
          class="col-item"
          :style="{ '--rc': `var(--rarity-${item.rarity})` }"
          :title="item.name"
        >
          {{ item.type === 'boost' ? '▲' : '◆' }}
        </span>
      </div>
    </div>

    <PullReveal v-if="pending" :results="pending" @done="collect" />
  </div>
</template>

<style scoped>
.gacha {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-2);
}

.screen-title {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.15em;
  text-align: center;
}

.banner {
  padding: var(--space-4);
}

.banner.premium {
  border-color: rgba(255, 77, 216, 0.35);
  box-shadow: var(--glow-sm) rgba(255, 77, 216, 0.12);
}

.banner-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-head h3 {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.1em;
}

.premium .banner-head h3 {
  color: var(--cores);
  text-shadow: var(--glow-sm) var(--cores-glow);
}

.pity {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
}

.banner-sub {
  font-size: 11px;
  color: var(--text-secondary);
  margin: var(--space-1) 0 var(--space-3);
}

.pull-row {
  display: flex;
  gap: var(--space-3);
}

.pull-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-border-bright);
  background: rgba(140, 180, 255, 0.06);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.1em;
  transition: all var(--dur-fast) var(--ease-out-back);
}

.pull-btn:hover {
  transform: translateY(-2px);
  border-color: var(--shards);
}

.pull-btn:active {
  transform: scale(0.95);
}

.pull-btn.ten {
  border-color: var(--prestige);
  background: rgba(255, 200, 61, 0.07);
}

.cost {
  font-size: 11px;
  font-weight: 700;
}

.cost.shards { color: var(--shards); }
.cost.cores { color: var(--cores); }

.collection {
  padding: var(--space-4);
}

.col-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.col-head h3 {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.1em;
}

.boost {
  font-size: 11px;
  color: var(--success);
}

.empty {
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  padding: var(--space-4) 0;
}

.col-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--space-2);
}

.col-item {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 1px solid var(--rc);
  border-radius: var(--radius-sm);
  color: var(--rc);
  font-size: 14px;
  text-shadow: var(--glow-sm) var(--rc);
}
</style>
