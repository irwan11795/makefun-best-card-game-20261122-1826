# Ember Court

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/irwan11795/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/irwan11795/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

A duel of rival wardens, fought one card at a time. An original card battler for the make.fun Best Card Game bounty.

## How to play

- Each round you get **3 energy** and draw up to **5 cards**.
- Click a card (or press **1–5**) to play it. **Space** ends your turn. **R** restarts.
- Cards strike, guard, draw, or grant energy. Two cards of **one suit** in a turn **SURGE +2**.
- Unspent energy becomes shield when your turn ends. First warden to **0 life** loses.
- The rival telegraphs its plan — watch the intent banner and answer it.

## Suits

- **Ember** (red flame) — strikes hard
- **Tide** (blue droplet) — guards deep
- **Thorn** (green leaf) — strikes and guards
- **Gale** (purple swirl) — draws and hastens

## Run it

Serve `game/` with any static server and open `index.html` in desktop Chrome. No network requests, no build step. `main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to `/output` and writes `dossier.json`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are real renders of the game's own code, taken in local Chromium.
