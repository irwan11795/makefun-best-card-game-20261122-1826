// render.js — everything the player sees: title, table, win and loss screens.
// Cards are DOM elements with CSS transitions (slide, flip, snap); suits are
// inline SVG shapes, told apart by colour AND shape, never by text alone.

import { SUITS, effectText } from './cards.js';
import { MAX_LIFE, BASE_ENERGY } from './rules.js';
import { intentText } from './opponent.js';

// Suit glyphs as inline SVG (24x24 viewBox), one distinct shape per suit.
export function suitSvg(suit, size = 22) {
  const meta = SUITS[suit];
  const paths = {
    flame: '<path d="M12 2 C9 6 5.5 8.5 5.5 13 a6.5 6.5 0 0 0 13 0 C18.5 8.5 15 6 12 2 Z"/><path fill="#fff" opacity="0.55" d="M12 10 C10.5 12 9 13 9 15 a3 3 0 0 0 6 0 C15 13 13.5 12 12 10 Z"/>',
    droplet: '<path d="M12 2 C12 2 5 10.5 5 15 a7 7 0 0 0 14 0 C19 10.5 12 2 12 2 Z"/><circle cx="9.5" cy="14.5" r="1.6" fill="#fff" opacity="0.6"/>',
    leaf: '<path d="M20 4 C11 4 4 10 4 20 C14 20 20 14 20 4 Z"/><path d="M4 20 C9 14 13 10 19 5" stroke="#fff" stroke-width="1.4" fill="none" opacity="0.6"/>',
    swirl: '<path d="M12 12 m-8 0 a8 8 0 1 1 8 8 a5.5 5.5 0 1 1 -5.5 -5.5 a3 3 0 1 0 3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  };
  const fill = suit === 'gale' ? 'none' : meta.color;
  const color = suit === 'gale' ? meta.color : 'none';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" color="${color}" aria-label="${meta.name}">${paths[meta.shape]}</svg>`;
}

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

function lifeBar(side, isPlayer) {
  const pct = Math.max(0, Math.round((side.life / MAX_LIFE) * 100));
  const bar = el('div', 'lifebar');
  const fill = el('div', 'lifefill' + (pct <= 30 ? ' low' : ''));
  fill.style.width = pct + '%';
  bar.appendChild(fill);
  const label = el('div', 'lifetext', `${isPlayer ? 'YOU' : 'RIVAL'} &nbsp;♥ ${side.life} / ${MAX_LIFE}${side.shield ? ` &nbsp;🛡 ${side.shield}` : ''}`);
  const wrap = el('div', 'lifewrap');
  wrap.appendChild(label);
  wrap.appendChild(bar);
  return wrap;
}

function energyPips(energy) {
  const wrap = el('div', 'energy');
  for (let i = 0; i < BASE_ENERGY + 2; i++) {
    const pip = el('div', 'pip' + (i < energy ? ' on' : ''));
    pip.textContent = '✦';
    wrap.appendChild(pip);
  }
  wrap.appendChild(el('span', 'energylabel', `Energy ${energy}`));
  return wrap;
}

// One face-up card. onPlay(index) fires when clicked; affordable cards lift on hover.
export function cardEl(card, index, opts = {}) {
  const meta = SUITS[card.suit];
  const c = el('div', 'card suit-' + card.suit + (opts.affordable === false ? ' unaffordable' : '') + (opts.played ? ' played' : ''));
  c.style.setProperty('--suit', meta.color);
  c.style.setProperty('--suit-dark', meta.dark);
  c.dataset.index = index;
  const surge = opts.surge ? '<div class="surgebadge">SURGE +2</div>' : '';
  c.innerHTML = `
    <div class="cardcost">${card.cost}</div>
    <div class="cardart">${suitSvg(card.suit, 44)}</div>
    <div class="cardname">${card.name}</div>
    <div class="cardsuit">${meta.name}</div>
    <div class="cardeffect">${effectText(card)}</div>
    ${surge}`;
  if (opts.onPlay) {
    c.addEventListener('click', () => opts.onPlay(index));
    c.tabIndex = 0;
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onPlay(index); } });
  }
  return c;
}

export function cardBackEl() {
  const c = el('div', 'card back');
  c.innerHTML = `<div class="backart">${suitSvg('ember', 34)}</div><div class="backname">EMBER<br>COURT</div>`;
  return c;
}

function floatText(container, text, cls) {
  const f = el('div', 'floattext ' + cls, text);
  f.style.left = (30 + Math.random() * 40) + '%';
  container.appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

export function render(state, root, hooks) {
  root.innerHTML = '';
  if (state.screen === 'title') renderTitle(state, root, hooks);
  else if (state.screen === 'table') renderTable(state, root, hooks);
  else renderEnd(state, root, hooks);
}

function renderTitle(state, root, hooks) {
  const t = el('div', 'screen title-screen');
  t.innerHTML = `
    <div class="title-emblem">${suitSvg('ember', 64)}</div>
    <h1 class="gametitle">EMBER COURT</h1>
    <p class="tagline">A duel of rival wardens, fought one card at a time.</p>
    <div class="legend">
      ${Object.entries(SUITS).map(([k, m]) => `<div class="legenditem"><span class="legendglyph">${suitSvg(k, 26)}</span><b>${m.name}</b><span>${{ ember: 'strikes hard', tide: 'guards deep', thorn: 'strikes & guards', gale: 'draws & hastens' }[k]}</span></div>`).join('')}
    </div>
    <p class="howto">Spend energy to play cards. Two cards of one suit in a turn <b>SURGE +2</b>.<br>Unspent energy becomes shield. First warden to 0 life loses.</p>
    <button class="bigbtn" id="startBtn">Begin the Duel</button>
    <p class="keys">Click a card or press 1–5 to play · Space ends your turn · R restarts</p>`;
  root.appendChild(t);
  t.querySelector('#startBtn').addEventListener('click', () => hooks.start());
}

function renderTable(state, root, hooks) {
  const t = el('div', 'screen table-screen');
  const isPlayerTurn = state.phase === 'player';

  // Rival row: hidden hand, life, energy, readable intent.
  const rivalRow = el('div', 'rivalrow');
  const rivalInfo = el('div', 'sideinfo');
  rivalInfo.appendChild(el('div', 'sidename', '⚔ Rival Warden'));
  rivalInfo.appendChild(lifeBar(state.rival, false));
  rivalInfo.appendChild(energyPips(state.rival.energy));
  const intent = el('div', 'intent', isPlayerTurn ? intentText(state) : 'The rival is thinking…');
  const rivalHand = el('div', 'hand rivalhand');
  state.rival.hand.forEach(() => rivalHand.appendChild(cardBackEl()));
  rivalRow.appendChild(rivalInfo);
  rivalRow.appendChild(rivalHand);
  rivalRow.appendChild(intent);

  // Middle: the played cards and the duel log.
  const mid = el('div', 'midrow');
  const played = el('div', 'playedzone');
  played.appendChild(el('div', 'zonelabel', 'Played this round'));
  const playedCards = el('div', 'playedcards');
  state.playedThisTurn.forEach((p) => playedCards.appendChild(cardEl(p, -1, { played: true, surge: p.surge })));
  state.rivalPlayed.forEach((p) => playedCards.appendChild(cardEl(p, -1, { played: true, surge: p.surge })));
  if (!state.playedThisTurn.length && !state.rivalPlayed.length) {
    playedCards.appendChild(el('div', 'emptyhint', 'No cards played yet this round.'));
  }
  played.appendChild(playedCards);
  const logBox = el('div', 'logbox');
  logBox.appendChild(el('div', 'zonelabel', 'Duel log'));
  state.log.slice(-4).forEach((line) => logBox.appendChild(el('div', 'logline', line)));
  mid.appendChild(played);
  mid.appendChild(logBox);

  // Player row: life, energy, face-up hand, end turn.
  const playerRow = el('div', 'playerrow');
  const playerInfo = el('div', 'sideinfo');
  playerInfo.appendChild(el('div', 'sidename', '✦ You'));
  playerInfo.appendChild(lifeBar(state.player, true));
  playerInfo.appendChild(energyPips(state.player.energy));
  const counts = el('div', 'deckcounts', `Deck ${state.player.deck.length} · Discard ${state.player.discard.length} · Round ${state.round}${state.round > 8 ? ' — the court burns!' : ' / 8'}`);
  playerInfo.appendChild(counts);
  const hand = el('div', 'hand playerhand');
  state.player.hand.forEach((card, i) => {
    const affordable = isPlayerTurn && state.player.energy >= card.cost;
    hand.appendChild(cardEl(card, i, {
      affordable,
      onPlay: isPlayerTurn ? (idx) => hooks.playCard(idx) : null,
    }));
  });
  const endBtn = el('button', 'endbtn' + (isPlayerTurn ? '' : ' disabled'), isPlayerTurn ? 'End Turn ⏎' : 'Rival’s turn…');
  endBtn.addEventListener('click', () => { if (isPlayerTurn) hooks.endTurn(); });
  playerRow.appendChild(playerInfo);
  playerRow.appendChild(hand);
  playerRow.appendChild(endBtn);

  t.appendChild(rivalRow);
  t.appendChild(mid);
  t.appendChild(playerRow);
  root.appendChild(t);

  // Floating damage numbers on the life bars when a big hit lands.
  const last = state.log[state.log.length - 1] || '';
  if (/Strike \d+/.test(last)) {
    const target = last.startsWith('You play') ? rivalRow : playerRow;
    floatText(target, last.match(/Strike (\d+)/)[0], 'dmg');
  }
}

function renderEnd(state, root, hooks) {
  const win = state.screen === 'win';
  const t = el('div', 'screen end-screen ' + (win ? 'win' : 'loss'));
  t.innerHTML = `
    <h1 class="endtitle">${win ? '🏆 VICTORY' : '🕯️ DEFEAT'}</h1>
    <p class="endsub">${win ? 'The court is yours — the rival’s lantern goes dark.' : 'The lanterns dim. The rival warden stands over the court.'}</p>
    <div class="endstats">
      <div><b>${state.round}</b><span>rounds</span></div>
      <div><b>${state.stats.damageDealt}</b><span>damage dealt</span></div>
      <div><b>${state.stats.cardsPlayed}</b><span>cards played</span></div>
      <div><b>${state.stats.surges}</b><span>surges</span></div>
      <div><b>${state.player.life}–${state.rival.life}</b><span>final life</span></div>
    </div>
    <button class="bigbtn" id="againBtn">Play Again</button>
    <p class="keys">Press R to play again</p>`;
  root.appendChild(t);
  t.querySelector('#againBtn').addEventListener('click', () => hooks.restart());
  if (win) {
    // A win that lands with a flourish: embers rising over the screen.
    const fx = el('div', 'confetti');
    for (let i = 0; i < 42; i++) {
      const s = el('span', 'ember');
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 1.6) + 's';
      s.style.animationDuration = (2.2 + Math.random() * 2.4) + 's';
      const colors = ['#e5484d', '#f5a524', '#ffcf5c', '#ff7a45'];
      s.style.background = colors[i % colors.length];
      fx.appendChild(s);
    }
    t.appendChild(fx);
  }
}
