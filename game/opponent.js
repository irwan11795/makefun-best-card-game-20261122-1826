// opponent.js — the Rival Warden's brain: greedy, readable, counterable.
// It scores every card it can afford, prefers a surge pair when it holds one,
// guards when hurt, and telegraphs its opening suit so the player can answer.

import { SUITS } from './cards.js';
import { playCard } from './rules.js';

// Value of one card to the rival, per energy spent. Draw and energy are worth
// more than raw numbers because they buy future turns.
export function scoreCard(state, card, suitsPlayed) {
  const surge = suitsPlayed.includes(card.suit);
  const atk = card.attack + (surge ? 2 : 0);
  const shd = card.shield + (surge ? 2 : 0);
  let value = atk + shd * 0.8 + card.draw * 1.5 + card.energy * 2;
  // Hurt rival turtles: shields are worth double below 9 life.
  if (state.rival.life <= 8 && card.shield > 0) value += card.shield;
  // A killing blow is worth everything.
  if (atk >= state.player.life - state.player.shield) value += 100;
  return value / card.cost;
}

// The card the rival plans to open with: the highest-scored affordable card.
// The table shows its suit as the rival's intent before the rival acts.
export function planRivalFirstCard(state) {
  const rival = state.rival;
  let best = null;
  let bestScore = -1;
  for (const card of rival.hand) {
    if (card.cost > rival.energy) continue;
    const s = scoreCard(state, card, state.rivalSuitsPlayed);
    if (s > bestScore) { bestScore = s; best = card; }
  }
  return best;
}

// The rival's intent: the suit it is gathering this round, readable on the table.
export function rivalIntent(state) {
  const plan = planRivalFirstCard(state);
  return plan ? plan.suit : null;
}

// Play the rival's whole turn, one card at a time. Returns the list of plays
// (card, surge, label) so render.js can animate them in order.
export function playRivalTurn(state) {
  const plays = [];
  const rival = state.rival;
  // Safety: never loop forever on energy-gain cards.
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    let bestIndex = -1;
    let bestScore = -1;
    for (let i = 0; i < rival.hand.length; i++) {
      const card = rival.hand[i];
      if (card.cost > rival.energy) continue;
      const s = scoreCard(state, card, state.rivalSuitsPlayed);
      // Prefer completing a surge pair over a slightly better single card.
      const bonus = state.rivalSuitsPlayed.includes(card.suit) ? 0.6 : 0;
      if (s + bonus > bestScore) { bestScore = s + bonus; bestIndex = i; }
    }
    if (bestIndex < 0) break;
    const res = playCard(state, rival, state.player, bestIndex, true);
    if (!res) break;
    plays.push(res);
    if (state.screen !== 'table') break;
  }
  return plays;
}

// Suit metadata for the intent banner.
export function intentText(state) {
  const suit = rivalIntent(state);
  if (!suit) return 'The rival waits…';
  const meta = SUITS[suit];
  return `Rival gathers ${meta.name}`;
}
