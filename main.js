/* ════════════════════════════════════════════════════════════
   main.js — entry point, event wiring, init
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────
   Speed buttons (desktop + mobile)
   ────────────────────────────────────────────────────────── */
document.querySelectorAll('.speed-btn[data-ms]').forEach(btn => {
  btn.addEventListener('click', () => setSpeed(Number(btn.dataset.ms)));
});

/* ──────────────────────────────────────────────────────────
   Pause buttons
   ────────────────────────────────────────────────────────── */
document.getElementById('pause-btn').addEventListener('click', togglePause);
const mobPause = document.getElementById('pause-btn-mobile');
if (mobPause) mobPause.addEventListener('click', togglePause);

/* ──────────────────────────────────────────────────────────
   Buy / Sell buttons
   ────────────────────────────────────────────────────────── */
document.getElementById('btn-buy').addEventListener('click',  () => executeTrade('buy'));
document.getElementById('btn-sell').addEventListener('click', () => executeTrade('sell'));

/* ──────────────────────────────────────────────────────────
   Qty input → live cost preview
   ────────────────────────────────────────────────────────── */
document.getElementById('qty-input').addEventListener('input', updateCostPreview);

/* ──────────────────────────────────────────────────────────
   Keyboard shortcuts
     B = buy    S = sell
     Space = pause/resume
     ← → = switch selected stock
   ────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  // ignore if typing in an input
  if (e.target.tagName === 'INPUT') return;

  switch (e.key.toLowerCase()) {
    case 'b':
      executeTrade('buy');
      break;
    case 's':
      executeTrade('sell');
      break;
    case ' ':
      e.preventDefault();
      togglePause();
      break;
    case 'arrowleft': {
      const idx = STOCK_DEFS.findIndex(d => d.ticker === state.selectedTicker);
      if (idx > 0) selectStock(STOCK_DEFS[idx - 1].ticker);
      break;
    }
    case 'arrowright': {
      const idx = STOCK_DEFS.findIndex(d => d.ticker === state.selectedTicker);
      if (idx < STOCK_DEFS.length - 1) selectStock(STOCK_DEFS[idx + 1].ticker);
      break;
    }
  }
});

/* ──────────────────────────────────────────────────────────
   Resize handler — redraw canvases on window resize
   ────────────────────────────────────────────────────────── */
let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    renderMainChart();
    renderVolume();
    renderEquityChart();
    STOCK_DEFS.forEach(d => renderMiniChart(d.ticker));
  }, 80);
});

/* ──────────────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────────────── */
initStocks();
buildRegimeLegend();
initChartHover();
updateUI();
startTimer();

/* ── welcome toast ── */
setTimeout(() => showToast('Welcome! Start with $10,000 — buy low, sell high 📈'), 600);
