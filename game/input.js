// input.js — keyboard and mouse for Ember Court.
// 1–5 play a card, Space/Enter ends the turn, R restarts, Enter starts from title.

export function bindInput(getState, hooks) {
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const state = getState();
    if (state.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      hooks.start();
      return;
    }
    if ((state.screen === 'win' || state.screen === 'loss') && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) {
      hooks.restart();
      return;
    }
    if (state.screen !== 'table') return;
    if (e.key >= '1' && e.key <= '5') {
      const idx = Number(e.key) - 1;
      if (state.phase === 'player' && state.player.hand[idx]) hooks.playCard(idx);
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (state.phase === 'player') hooks.endTurn();
      return;
    }
    if (e.key === 'r' || e.key === 'R') hooks.restart();
  });
}
