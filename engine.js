/* ════════════════════════════════════════════════════════════
   engine.js — price engine, tick loop, portfolio
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ── app state ── */
const state = {
  cash:            STARTING_CASH,
  tick:            0,
  day:             1,
  paused:          false,
  speed:           800,       // ms per tick
  selectedTicker:  STOCK_DEFS[0].ticker,
  stocks:          {},        // ticker → { ...def, price, history, open }
  holdings:        {},        // ticker → { qty, avgCost }
  tradeLog:        [],        // newest first
  equityHistory:   [STARTING_CASH],
};

/* boom/bust internal phase tracker */
const boomState = {};

/* ── INIT ── */
function initStocks() {
  STOCK_DEFS.forEach(def => {
    const hist = [];
    let p = def.startPrice;

    // seed 40 candles so the chart looks alive from the start
    for (let i = 0; i < 40; i++) {
      const c = _makeCandle(def.ticker, p, def.regime);
      hist.push(c);
      p = c.c;
    }

    state.stocks[def.ticker] = {
      ...def,
      price:   p,
      history: hist,
      open:    p,
    };

    boomState[def.ticker] = { phase: 'neutral', streak: 0 };
  });
}

/* ── PRICE ENGINE ── */

/**
 * Generate one OHLCV candle for a stock and advance its price.
 * Returns the new candle.
 */
function nextPrice(ticker) {
  const stock  = state.stocks[ticker];
  const r      = REGIMES[stock.regime];
  const price  = stock.price;

  let drift = r.drift;
  let vol   = r.vol;

  /* ── special regime logic ── */

  if (stock.regime === 'boom_bust') {
    const bs = boomState[ticker];
    bs.streak++;
    if (bs.phase === 'boom') {
      drift = +0.025; vol = 0.015;
      if (bs.streak > 8 + Math.random() * 6) {
        bs.phase = 'bust'; bs.streak = 0;
      }
    } else if (bs.phase === 'bust') {
      drift = -0.030; vol = 0.020;
      if (bs.streak > 5 + Math.random() * 4) {
        bs.phase = 'neutral'; bs.streak = 0;
      }
    } else {
      drift = (Math.random() - 0.5) * 0.01;
      if (Math.random() < 0.07) { bs.phase = 'boom'; bs.streak = 0; }
    }
  }

  if (stock.regime === 'mean_revert') {
    const slice = stock.history.slice(-30);
    const mean  = slice.reduce((s, c) => s + c.c, 0) / (slice.length || 1);
    drift = (mean - price) / price * 0.15;
  }

  const candle = _makeCandle(ticker, price, stock.regime, drift, vol);
  stock.history.push(candle);
  if (stock.history.length > HISTORY_LEN) stock.history.shift();
  stock.price = candle.c;
  return candle;
}

/** Build one OHLCV candle from a starting price and regime params. */
function _makeCandle(ticker, price, regime, drift, vol) {
  const r = REGIMES[regime];
  const d = (drift !== undefined) ? drift : r.drift;
  const v = (vol   !== undefined) ? vol   : r.vol;

  const chg  = d + (Math.random() - 0.5) * v * 2;
  const o    = price;
  const c    = Math.max(0.01, price * (1 + chg));
  const high = Math.max(o, c) * (1 + Math.random() * v * 0.6);
  const low  = Math.min(o, c) * (1 - Math.random() * v * 0.6);
  return {
    o, h: high, l: low, c,
    v: Math.round(50_000 + Math.random() * 950_000),
  };
}

/* ── TICK LOOP ── */
let _tickTimer = null;

function tick() {
  if (state.paused) return;
  state.tick++;
  if (state.tick % 24 === 0) state.day++;

  STOCK_DEFS.forEach(def => nextPrice(def.ticker));

  // equity snapshot every 5 ticks
  if (state.tick % 5 === 0) {
    state.equityHistory.push(portfolioValue());
    if (state.equityHistory.length > 200) state.equityHistory.shift();
  }

  updateUI();
}

function startTimer() {
  clearInterval(_tickTimer);
  _tickTimer = setInterval(tick, state.speed);
}

function setSpeed(ms) {
  state.speed = ms;
  // sync all speed buttons (desktop + mobile)
  document.querySelectorAll('.speed-btn[data-ms]').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.ms) === ms);
  });
  startTimer();
}

function togglePause() {
  state.paused = !state.paused;
  const label = state.paused ? '▶ Resume' : '⏸ Pause';
  document.getElementById('pause-btn').textContent        = label;
  const mob = document.getElementById('pause-btn-mobile');
  if (mob) mob.textContent = state.paused ? '▶' : '⏸';
  document.getElementById('paused-badge').style.display   = state.paused ? 'block' : 'none';
}

/* ── PORTFOLIO HELPERS ── */

function portfolioValue() {
  let invested = 0;
  Object.entries(state.holdings).forEach(([tk, h]) => {
    invested += h.qty * state.stocks[tk].price;
  });
  return state.cash + invested;
}

function investedValue() {
  let total = 0;
  Object.entries(state.holdings).forEach(([tk, h]) => {
    total += h.qty * state.stocks[tk].price;
  });
  return total;
}

/* ── TRADING ── */

let _msgTimer;

function executeTrade(side) {
  const ticker = state.selectedTicker;
  const qty    = parseInt(document.getElementById('qty-input').value, 10) || 0;
  const price  = state.stocks[ticker].price;
  const total  = qty * price;

  if (qty <= 0) { showTradeMsg('Enter valid quantity', 'err'); return; }

  if (side === 'buy') {
    if (total > state.cash) { showTradeMsg('Insufficient cash', 'err'); return; }
    state.cash -= total;
    const h    = state.holdings[ticker] || { qty: 0, avgCost: 0 };
    const newQ = h.qty + qty;
    h.avgCost  = (h.avgCost * h.qty + total) / newQ;
    h.qty      = newQ;
    state.holdings[ticker] = h;
    _logTrade('buy', ticker, qty, price);
    showTradeMsg(`Bought ${qty} × ${ticker}`, 'ok');
    showToast(`✓ Bought ${qty} shares of ${ticker} @ $${fmt2(price)}`);
  } else {
    const h = state.holdings[ticker];
    if (!h || h.qty < qty) { showTradeMsg('Not enough shares', 'err'); return; }
    state.cash += total;
    h.qty -= qty;
    if (h.qty === 0) delete state.holdings[ticker];
    _logTrade('sell', ticker, qty, price);
    showTradeMsg(`Sold ${qty} × ${ticker}`, 'ok');
    showToast(`✓ Sold ${qty} shares of ${ticker} @ $${fmt2(price)}`);
  }

  updateUI();
}

function _logTrade(side, ticker, qty, price) {
  state.tradeLog.unshift({ side, ticker, qty, price, tick: state.tick });
  if (state.tradeLog.length > 50) state.tradeLog.pop();
}

function showTradeMsg(txt, cls) {
  const el      = document.getElementById('trade-msg');
  el.textContent = txt;
  el.className   = 'trade-msg ' + cls;
  clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => {
    el.textContent = '';
    el.className   = 'trade-msg';
  }, 2500);
}

let _toastTimer;
function showToast(txt) {
  const t       = document.getElementById('toast');
  t.textContent = txt;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── NUMBER FORMATTING ── */
function fmt2(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
