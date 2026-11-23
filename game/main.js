// main.js — boot and state machine for Ember Court.
// Wires rules + opponent + render + input together, runs the rival's turn with
// a visible beat between plays, and offers ?shot= setups for screenshots.

import { newGame, startDuel, playCard, endPlayerTurn, beginRound, MAX_ROUNDS } from './rules.js';
import { playRivalTurn } from './opponent.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { CARD_DEFS } from './cards.js';

const root = document.getElementById('app');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '7');

let state = newGame(seed);

function draw() {
  render(state, root, hooks);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runRivalTurn() {
  if (state.screen !== 'table') return;
  draw();
  await sleep(650);
  const plays = playRivalTurn(state);
  // Re-render between plays so each rival card is seen landing.
  for (const _p of plays) {
    draw();
    await sleep(420);
    if (state.screen !== 'table') return;
  }
  // Bank the rival's leftover energy into shield, then open the next round.
  if (state.rival.energy > 0) {
    state.rival.shield += state.rival.energy;
    state.rival.energy = 0;
    state.log.push(`Rival banks ${state.rival.shield > 0 ? 'leftover energy into shield' : 'nothing'}.`);
  }
  if (state.screen !== 'table') { draw(); return; }
  beginRound(state);
  draw();
}

const hooks = {
  start() {
    state = newGame(seed);
    startDuel(state);
    draw();
  },
  restart() {
    state = newGame(seed);
    startDuel(state);
    draw();
  },
  playCard(idx) {
    if (state.phase !== 'player' || state.screen !== 'table') return;
    const card = state.player.hand[idx];
    if (!card || state.player.energy < card.cost) return;
    playCard(state, state.player, state.rival, idx, false);
    draw();
  },
  async endTurn() {
    if (state.phase !== 'player' || state.screen !== 'table') return;
    endPlayerTurn(state);
    await runRivalTurn();
  },
};

// Deterministic screenshot setups (?shot=title|table|win|loss&seed=N).
// They build real game states through the same rules the player uses.
function applyShot() {
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'title') {
    state.screen = 'title';
    return;
  }
  state = newGame(seed);
  startDuel(state);
  if (shot === 'table') {
    // A mid-game table: round 3, shields up, cards already played, log alive.
    state.round = 3;
    state.player.life = 14;
    state.rival.life = 11;
    state.player.shield = 4;
    state.rival.shield = 2;
    state.player.energy = 2;
    // Script a few real plays so the played zone and log are full.
    const emberIdx = state.player.hand.findIndex((c) => c.suit === 'ember' && c.cost <= 2);
    if (emberIdx >= 0) playCard(state, state.player, state.rival, emberIdx, false);
    const tideIdx = state.player.hand.findIndex((c) => c.suit === 'tide');
    if (tideIdx >= 0 && state.player.energy >= state.player.hand[tideIdx].cost) {
      playCard(state, state.player, state.rival, tideIdx, false);
    }
    if (state.rival.hand.length > 0) playCard(state, state.rival, state.player, 0, true);
    state.log.push('Round 3 — the court is warm now.');
  } else if (shot === 'win') {
    state.rival.life = 0;
    state.screen = 'win';
    state.phase = 'over';
    state.stats = { damageDealt: 23, damageTaken: 9, cardsPlayed: 14, surges: 3 };
    state.round = 6;
  } else if (shot === 'loss') {
    state.player.life = 0;
    state.screen = 'loss';
    state.phase = 'over';
    state.stats = { damageDealt: 12, damageTaken: 21, cardsPlayed: 11, surges: 1 };
    state.round = 7;
  }
}

applyShot();
draw();
bindInput(() => state, hooks);

// Debug hooks for scripted play-tests. They call the same functions a player
// uses and change nothing about normal play.
window.__ember = {
  get state() { return state; },
  hooks,
  startDuel,
  playCard,
  endPlayerTurn,
  beginRound,
  playRivalTurn,
  CARD_DEFS,
  MAX_ROUNDS,
};
