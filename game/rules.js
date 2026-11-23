// rules.js — the rules of Ember Court: turns, energy, surge, damage, winning and losing.
// Pure state logic; rendering lives in render.js, the rival's brain in opponent.js.

import { buildDeck, makeRng, shuffle } from './cards.js';

export const MAX_LIFE = 20;
export const HAND_SIZE = 5;
export const BASE_ENERGY = 3;
export const MAX_ROUNDS = 8;
export const BURN_DAMAGE = 2; // from round 9 on, the court burns both wardens each round

export function newGame(seed = 1) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    screen: 'title', // title | table | win | loss
    round: 1,
    phase: 'player', // player | rival | over
    player: newSide('You'),
    rival: newSide('Rival Warden'),
    log: [],
    playedThisTurn: [], // cards the player played this turn (for surge + display)
    rivalPlayed: [], // cards the rival played this turn
    suitsPlayed: [], // suits the player played this turn (surge tracking)
    rivalSuitsPlayed: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, surges: 0 },
    winner: null,
    message: '',
  };
  return state;
}

function newSide(name) {
  return { name, life: MAX_LIFE, shield: 0, energy: BASE_ENERGY, deck: [], discard: [], hand: [] };
}

export function startDuel(state) {
  state.player.deck = buildDeck(state.rng);
  state.rival.deck = buildDeck(state.rng);
  state.player.discard = [];
  state.rival.discard = [];
  drawUpTo(state.player, HAND_SIZE, state.rng);
  drawUpTo(state.rival, HAND_SIZE, state.rng);
  state.screen = 'table';
  state.phase = 'player';
  state.round = 1;
  state.player.energy = BASE_ENERGY;
  state.rival.energy = BASE_ENERGY;
  state.log = ['The lanterns are lit. Your move, warden.'];
  state.message = '';
  state.winner = null;
}

export function drawUpTo(side, n, rng) {
  while (side.hand.length < n) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle(side.discard, rng || Math.random);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
  }
}

function drawCards(side, n, rng) {
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle(side.discard, rng || Math.random);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
  }
}

// Resolve one played card. Surge: the second card of a suit in the same turn
// gains +2 to its attack and shield. Returns a description of what happened.
export function playCard(state, side, foe, cardIndex, isRival) {
  const hand = side.hand;
  const card = hand[cardIndex];
  if (!card) return null;
  if (side.energy < card.cost) return null;

  const suitsPlayed = isRival ? state.rivalSuitsPlayed : state.suitsPlayed;
  const surge = suitsPlayed.includes(card.suit);
  const atk = card.attack + (surge ? 2 : 0);
  const shd = card.shield + (surge ? 2 : 0);

  side.energy -= card.cost;
  hand.splice(cardIndex, 1);
  side.discard.push(card);
  suitsPlayed.push(card.suit);
  if (surge) state.stats.surges += isRival ? 0 : 1;

  const bits = [];
  if (shd > 0) { side.shield += shd; bits.push(`Guard ${shd}`); }
  if (card.draw > 0) { drawCards(side, card.draw, state.rng); bits.push(`Draw ${card.draw}`); }
  if (card.energy > 0) { side.energy += card.energy; bits.push(`+${card.energy} energy`); }
  if (atk > 0) {
    const blocked = Math.min(foe.shield, atk);
    foe.shield -= blocked;
    const through = atk - blocked;
    foe.life = Math.max(0, foe.life - through);
    if (!isRival) state.stats.damageDealt += through;
    else state.stats.damageTaken += through;
    bits.push(through > 0 ? `Strike ${atk}${blocked ? ` (${blocked} blocked)` : ''}` : `Strike ${atk} — fully blocked`);
  }
  if (!isRival) state.stats.cardsPlayed += 1;

  const label = `${side.name === 'You' ? 'You play' : 'Rival plays'} ${card.name}${surge ? ' — SURGE +2!' : ''}: ${bits.join(', ') || 'nothing'}`;
  state.log.push(label);
  if (state.log.length > 4) state.log.shift();

  if (isRival) state.rivalPlayed.push({ ...card, surge, atk, shd });
  else state.playedThisTurn.push({ ...card, surge, atk, shd });

  checkEnd(state);
  return { card, surge, atk, shd, label };
}

export function checkEnd(state) {
  if (state.screen === 'win' || state.screen === 'loss') return;
  if (state.rival.life <= 0 && state.player.life <= 0) {
    // Both fell at once: the one with more shield stands; else the player falls.
    state.winner = state.player.shield >= state.rival.shield ? 'player' : 'rival';
  } else if (state.rival.life <= 0) {
    state.winner = 'player';
  } else if (state.player.life <= 0) {
    state.winner = 'rival';
  }
  if (state.winner) {
    state.screen = state.winner === 'player' ? 'win' : 'loss';
    state.phase = 'over';
  }
}

// End the player's turn: unspent energy banks into shield, then the rival acts,
// then a new round begins. Returns the rival's played cards for animation.
export function endPlayerTurn(state) {
  if (state.phase !== 'player' || state.screen !== 'table') return;
  bankEnergy(state.player);
  state.phase = 'rival';
  state.playedThisTurn = [];
  state.suitsPlayed = [];
}

function bankEnergy(side) {
  if (side.energy > 0) {
    side.shield += side.energy;
    side.energy = 0;
  }
}

export function beginRound(state) {
  state.round += 1;
  state.rivalPlayed = [];
  state.rivalSuitsPlayed = [];
  state.playedThisTurn = [];
  state.suitsPlayed = [];
  if (state.round > MAX_ROUNDS) {
    // The court burns: both wardens lose life each round until one falls.
    state.player.life = Math.max(0, state.player.life - BURN_DAMAGE);
    state.rival.life = Math.max(0, state.rival.life - BURN_DAMAGE);
    state.log.push(`The court burns — both wardens lose ${BURN_DAMAGE} life.`);
    checkEnd(state);
    if (state.screen !== 'table') return;
  }
  state.player.energy = BASE_ENERGY;
  state.rival.energy = BASE_ENERGY;
  drawUpTo(state.player, HAND_SIZE, state.rng);
  drawUpTo(state.rival, HAND_SIZE, state.rng);
  state.phase = 'player';
  state.log.push(`Round ${state.round} — your move, warden.`);
  if (state.log.length > 4) state.log.shift();
}

export function canAfford(side, card) {
  return side.energy >= card.cost;
}

