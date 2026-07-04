# HYPERSCALE

An incremental browser game about scaling a datacenter: run hypersatisfying
minigames to earn **Dollars** and **Compute**, pull the gacha for hardware,
and grow the number that only goes up. Dark tech aesthetic, all juice
synthesized in-browser (canvas particles + Web Audio) — zero asset files,
zero backend.

## Play

```bash
npm install
npm run dev
```

Progress persists in localStorage. `npm run build` type-checks (`vue-tsc -b`)
before bundling; run `npm run typecheck` on its own to just check types.

## The loop

1. **Play** any minigame → score converts to **$ Dollars** (cyan) and
   occasionally **Compute** (magenta) via per-game reward curves.
2. **Dollars** feed the Standard gacha banner; **Compute** feeds the premium
   Singularity banner with boosted top-tier odds.
3. Gacha items are cosmetics and small capped **earn multipliers**, with
   soft pity from pull 40 and a guaranteed Epic+ at 50.
4. **Daily directives** (3 rotating quests) and a 7-day **daily uplink**
   streak keep both currencies flowing.
5. All earnings also grow **Scale** — the number that only goes up.
   At 10K Scale, **Rebirth** resets your Dollars for a permanent
   stacking +5% earnings multiplier.

## Minigames

| Game | Loop |
|---|---|
| Bubble Pop | Tap same-color chains before the timer ends; gold bubbles pay Compute |
| Load Balancer | Requests pile into two pools at different rates; tap when the sweeping marker crosses the drifting balance point |
| Eviction Scheduler | Racks fill with pods; evict the one under the needle above the gold line; a rack at 100% melts |
| Slice Reflex | Swipe through falling shards; 3+ per stroke pays Compute; avoid mines |
| Pattern Match | Simon-style sequences; rewards grow superlinearly per round |

## Architecture

- **Vue 3 + TypeScript + Pinia (persisted)** for the meta layer: HUD, hub,
  gacha, quests, dailies. Reactive state never touches per-frame game state.
- **Canvas + typed engine** (`src/engine/`) for gameplay: rAF game loop,
  pooled particles, tweens, screen shake, seeded RNG, synthesized SFX.
  Rule: if two minigames need the same effect, it lives in `engine/`, not
  a component.
- **One reward funnel** (`src/composables/useMinigameResult.ts`):
  score → reward curve (`src/minigames/registry.ts`) → prestige/gacha
  multipliers → store commit → quest events → toasts/SFX.

Dev playground for engine primitives: `/#/devlab`.
