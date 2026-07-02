# HYPERSATISFYING

A browser-based collection of hypersatisfying minigames wrapped in an
always-something-to-do meta loop: growing numbers, gacha pulls, daily
directives, and a prestige system. Dark tech aesthetic, all juice
synthesized in-browser (canvas particles + Web Audio) — zero asset files,
zero backend.

## Play

```bash
npm install
npm run dev
```

Progress persists in localStorage.

## The loop

1. **Play** any minigame → score converts to **Shards** (cyan) and
   occasionally **Cores** (magenta) via per-game reward curves.
2. **Shards** feed the Standard gacha banner; **Cores** feed the premium
   Singularity banner with boosted top-tier odds.
3. Gacha items are cosmetics and small capped **earn multipliers**, with
   soft pity from pull 40 and a guaranteed Epic+ at 50.
4. **Daily directives** (3 rotating quests) and a 7-day **daily uplink**
   streak keep both currencies flowing.
5. All earnings also grow **Mastery** — the number that only goes up.
   At 10K Mastery, **Rebirth** resets your Shards for a permanent
   stacking +5% earnings multiplier.

## Minigames

| Game | Loop |
|---|---|
| Bubble Pop | Tap same-color chains before the timer ends; gold bubbles pay Cores |
| Rhythm Bar | Tap when the marker crosses the gold zone; perfects chain combos |
| Slice Reflex | Swipe through falling shards; 3+ per stroke pays Cores; avoid mines |
| Pattern Match | Simon-style sequences; rewards grow superlinearly per round |

## Architecture

- **Vue 3 + Pinia (persisted)** for the meta layer: HUD, hub, gacha,
  quests, dailies. Reactive state never touches per-frame game state.
- **Canvas + plain JS engine** (`src/engine/`) for gameplay: rAF game
  loop, pooled particles, tweens, screen shake, seeded RNG, synthesized
  SFX. Rule: if two minigames need the same effect, it lives in
  `engine/`, not a component.
- **One reward funnel** (`src/composables/useMinigameResult.js`):
  score → reward curve (`src/minigames/registry.js`) → prestige/gacha
  multipliers → store commit → quest events → toasts/SFX.

Dev playground for engine primitives: `/#/devlab`.
