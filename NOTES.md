# Ember Court — design notes

## The game in five lines

1. Two wardens, 20 life each, duel over up to 8 rounds (then the court burns: both lose 2 life a round until one falls).
2. Each round: 3 energy, draw to 5 cards from a 24-card deck (4 suits × 6 cards).
3. Cards cost 1–3 energy and strike, guard, draw, or grant energy; unspent energy banks into shield.
4. **Surge:** the second card of a suit played in one turn gains +2 attack and shield — the core decision (spend now, or hold a matching suit for the surge?).
5. The rival AI plays greedily with a readable telegraph: the intent banner names the suit it is gathering, so the player can guard or race in answer.

## How each judging criterion is met

1. **Complete game, shown in screenshots:** title screen (01 is the mid-game table cover, 02 title, 03 win, 04 loss — all four states are real renders), player's hand face-up + rival's hand face-down, cards with readable cost/value/suit (colour + shape), life totals with bars for both sides, distinct win and loss screens with stats.
2. **Fun and depth:** every hand is a decision — energy is scarce (3/round), surge rewards holding a matching suit, banking rewards ending early, draw/energy cards trade tempo for future turns. The rival's greedy AI is readable (intent banner + narrated log) and counterable (guard into its telegraphed suit, or race it down).
3. **Feel and polish:** cards slide in on the deal with a stagger, hover lifts a card, played cards pop into the played zone, damage numbers float off the life bars, the win screen rains embers.
4. **Look and originality:** original theme (lantern-lit warden court), original card names, CSS/SVG art drawn for this game only. Suits are told apart by colour AND shape (flame, droplet, leaf, swirl). No commercial game's names, characters, art or music.
5. **Structure:** one clear job per file — `cards.js` (deck + suits), `rules.js` (turns + resolution), `opponent.js` (rival AI + intent), `render.js` (all screens), `input.js` (keyboard + mouse), `main.js` (boot + state machine + shot hooks), `styles.css`, `index.html`. `main.ts` hands the game in; `vendor/makefun-game.ts` is the kit's copy, unchanged.

## Screenshots

- `01-table.jpg` — mid-game table (the cover): rival hand, intent banner, played zone, log, player hand, life and energy.
- `02-title.jpg` — title screen with suit legend and how-to.
- `03-win.jpg` — victory screen with ember flourish and stats.
- `04-loss.jpg` — defeat screen with stats.
- Taken in local Chromium from the game's own code via `?shot=` setups (seeded, deterministic). Each ≤ 256 KiB, 1280×800.

## Honest weaknesses

- **Weakest criterion: 3 (feel and polish).** The animations are CSS transitions on DOM cards — solid, but no canvas particles during play, no card flip on the rival's hand, no sound. Against a game with heavier juice it can read as quiet.
- The rival AI is greedy, not strategic: it never saves a card for a later surge across rounds, and it cannot bluff. A sharp player can beat it consistently by guarding into its telegraphed suit.
- One deck of 24 cards: long games reshuffle the discard pile, so late rounds can feel samey.
- No sound at all (a deliberate choice: no audio assets to keep the entry self-contained and silent).

## Alternatives considered and rejected

- A poker-style hand-ranking game: too close to a commercial game, and hand rankings are hard to read at thumbnail size.
- A deck-builder with a shop between rounds: deeper, but the extra screens dilute the four screenshots and the 12-hour budget.
- Canvas rendering: prettier particles, but DOM cards are far more legible when shrunk to the judge's contact sheet.
