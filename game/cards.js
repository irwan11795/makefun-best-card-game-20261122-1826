// cards.js — the deck of Ember Court: four suits, each told apart by colour AND shape.
// Every card is an original design for this game. No borrowed names, art or text.

export const SUITS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d20', shape: 'flame' },
  tide: { name: 'Tide', color: '#3e8fe0', dark: '#174a7d', shape: 'droplet' },
  thorn: { name: 'Thorn', color: '#43a86b', dark: '#1d5c34', shape: 'leaf' },
  gale: { name: 'Gale', color: '#9b6dd6', dark: '#4d2a7d', shape: 'swirl' },
};

// A card: id, suit, name, cost (energy), attack, shield, draw, energy.
// attack/shield/draw/energy are the effect amounts; a card may mix two of them.
export const CARD_DEFS = [
  // Ember — the attacking suit.
  { id: 'cinder-lash', suit: 'ember', name: 'Cinder Lash', cost: 1, attack: 3, shield: 0, draw: 0, energy: 0 },
  { id: 'bonfire', suit: 'ember', name: 'Bonfire', cost: 2, attack: 5, shield: 0, draw: 0, energy: 0 },
  { id: 'wildfire', suit: 'ember', name: 'Wildfire', cost: 3, attack: 7, shield: 0, draw: 0, energy: 0 },
  { id: 'ash-veil', suit: 'ember', name: 'Ash Veil', cost: 1, attack: 0, shield: 4, draw: 0, energy: 0 },
  { id: 'kindled-edge', suit: 'ember', name: 'Kindled Edge', cost: 2, attack: 4, shield: 2, draw: 0, energy: 0 },
  { id: 'spark-snatch', suit: 'ember', name: 'Spark Snatch', cost: 1, attack: 0, shield: 0, draw: 1, energy: 0 },
  // Tide — the shielding suit.
  { id: 'still-water', suit: 'tide', name: 'Still Water', cost: 1, attack: 0, shield: 4, draw: 0, energy: 0 },
  { id: 'deep-pool', suit: 'tide', name: 'Deep Pool', cost: 2, attack: 0, shield: 7, draw: 0, energy: 0 },
  { id: 'moon-tide', suit: 'tide', name: 'Moon Tide', cost: 2, attack: 0, shield: 0, draw: 2, energy: 0 },
  { id: 'undertow', suit: 'tide', name: 'Undertow', cost: 2, attack: 4, shield: 0, draw: 0, energy: 0 },
  { id: 'rain-call', suit: 'tide', name: 'Rain Call', cost: 1, attack: 2, shield: 0, draw: 1, energy: 0 },
  { id: 'spring-surge', suit: 'tide', name: 'Spring Surge', cost: 3, attack: 0, shield: 9, draw: 0, energy: 0 },
  // Thorn — the balanced suit.
  { id: 'bramble-snare', suit: 'thorn', name: 'Bramble Snare', cost: 1, attack: 2, shield: 2, draw: 0, energy: 0 },
  { id: 'root-hold', suit: 'thorn', name: 'Root Hold', cost: 2, attack: 3, shield: 3, draw: 0, energy: 0 },
  { id: 'thorn-wall', suit: 'thorn', name: 'Thorn Wall', cost: 2, attack: 0, shield: 6, draw: 0, energy: 0 },
  { id: 'vine-whip', suit: 'thorn', name: 'Vine Whip', cost: 1, attack: 3, shield: 0, draw: 0, energy: 0 },
  { id: 'seed-burst', suit: 'thorn', name: 'Seed Burst', cost: 2, attack: 5, shield: 0, draw: 0, energy: 0 },
  { id: 'bloom', suit: 'thorn', name: 'Bloom', cost: 1, attack: 0, shield: 2, draw: 1, energy: 0 },
  // Gale — the tempo suit.
  { id: 'swift-step', suit: 'gale', name: 'Swift Step', cost: 1, attack: 0, shield: 0, draw: 1, energy: 0 },
  { id: 'windfall', suit: 'gale', name: 'Windfall', cost: 2, attack: 0, shield: 0, draw: 0, energy: 2 },
  { id: 'storm-call', suit: 'gale', name: 'Storm Call', cost: 3, attack: 6, shield: 0, draw: 0, energy: 0 },
  { id: 'gust-guard', suit: 'gale', name: 'Gust Guard', cost: 1, attack: 0, shield: 3, draw: 0, energy: 0 },
  { id: 'tailwind', suit: 'gale', name: 'Tailwind', cost: 2, attack: 4, shield: 0, draw: 1, energy: 0 },
  { id: 'cyclone', suit: 'gale', name: 'Cyclone', cost: 3, attack: 5, shield: 3, draw: 0, energy: 0 },
];

// Small deterministic RNG (mulberry32) so screenshot setups are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// A fresh 24-card deck (one copy of each definition), shuffled by the given rng.
export function buildDeck(rng) {
  return shuffle(CARD_DEFS.map((c) => ({ ...c, uid: c.id })), rng);
}

// One-line human-readable effect text for a card face.
export function effectText(card) {
  const parts = [];
  if (card.attack) parts.push(`Strike ${card.attack}`);
  if (card.shield) parts.push(`Guard ${card.shield}`);
  if (card.draw) parts.push(`Draw ${card.draw}`);
  if (card.energy) parts.push(`+${card.energy} energy`);
  return parts.join(' · ') || '—';
}
