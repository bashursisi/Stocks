/* ════════════════════════════════════════════════════════════
   ui.js — DOM rendering for stock list, portfolio, holdings,
           trade log, and regime legend
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────
   Master update — called every tick
   ────────────────────────────────────────────────────────── */
function updateUI() {
  _updateTopBar();
  renderStockList();
  renderMainChart();
  renderVolume();
  renderEquityChart();
  renderPortfolioPanel();
  renderHoldings();
  renderTradeLog();
  updateCostPreview();
}

/* ──────────────────────────────────────────────────────────
   TOP BAR
   ────────────────────────────────────────────────────────── */
function _updateTopBar() {
  document.getElementById('tb-day').textContent  = state.day;
  document.getElementById('tb-tick').textContent = state.tick;

  const portVal  = portfolioValue();
  const portChg  = portVal - STARTING_CASH;
  const portPct  = portChg / STARTING_CASH * 100;
  const bull     = portChg >= 0;

  document.getElementById('tb-portval').textContent = '$' + fmt2(portVal);

  const pce = document.getElementById('tb-portchg');
  pce.textContent = `${bull ? '+' : '-'}$${fmt2(Math.abs(portChg))} (${bull ? '+' : ''}${portPct.toFixed(2)}%)`;
  pce.style.color = bull ? 'var(--bull)' : 'var(--bear)';
}

/* ──────────────────────────────────────────────────────────
   STOCK LIST (left sidebar)
   ────────────────────────────────────────────────────────── */
function renderStockList() {
  const container = document.getElementById('stock-items');
  document.getElementById('live-count').textContent = STOCK_DEFS.length;

  STOCK_DEFS.forEach(def => {
    const s    = state.stocks[def.ticker];
    const hist = s.history;
    const prev = hist.length > 1 ? hist[hist.length - 2].c : (hist[0]?.o ?? s.price);
    const chg  = (s.price - prev) / prev * 100;
    const bull = chg >= 0;
    const r    = REGIMES[def.regime];

    /* create card once */
    let el = document.getElementById('sc-' + def.ticker);
    if (!el) {
      el = document.createElement('div');
      el.className   = 'stock-card';
      el.id          = 'sc-' + def.ticker;
      el.addEventListener('click', () => selectStock(def.ticker));
      el.innerHTML = `
        <div class="sc-regime"></div>
        <div class="sc-row1">
          <span class="sc-ticker">${def.ticker}</span>
          <span class="sc-price"></span>
        </div>
        <div class="sc-row2">
          <span class="sc-name">${def.name}</span>
          <span class="sc-chg"></span>
        </div>
        <canvas class="sc-mini" id="mini-${def.ticker}"></canvas>
      `;
      container.appendChild(el);
    }

    /* update values */
    el.classList.toggle('selected', def.ticker === state.selectedTicker);
    el.querySelector('.sc-price').textContent = '$' + fmt2(s.price);

    const chgEl = el.querySelector('.sc-chg');
    chgEl.textContent = `${bull ? '+' : ''}${chg.toFixed(2)}%`;
    chgEl.className   = 'sc-chg ' + (bull ? 'up' : 'dn');

    el.querySelector('.sc-regime').textContent = r.label;

    /* price flash */
    const flashClass = bull ? 'flash-up' : 'flash-dn';
    const otherFlash = bull ? 'flash-dn' : 'flash-up';
    el.classList.remove(otherFlash);
    void el.offsetWidth;           // force reflow to restart animation
    el.classList.add(flashClass);

    renderMiniChart(def.ticker);
  });
}

/* ──────────────────────────────────────────────────────────
   PORTFOLIO SUMMARY (right panel top)
   ────────────────────────────────────────────────────────── */
function renderPortfolioPanel() {
  const portVal = portfolioValue();
  const inv     = investedValue();
  const pnl     = portVal - STARTING_CASH;
  const ret     = (pnl / STARTING_CASH) * 100;
  const bull    = pnl >= 0;

  document.getElementById('cash-val').textContent = '$' + fmt2(state.cash);
  document.getElementById('inv-val').textContent  = '$' + fmt2(inv);

  const pnlEl = document.getElementById('pnl-val');
  pnlEl.textContent = `${bull ? '+' : '-'}$${fmt2(Math.abs(pnl))}`;
  pnlEl.style.color = bull ? 'var(--bull)' : 'var(--bear)';

  const retEl = document.getElementById('ret-val');
  retEl.textContent = `${bull ? '+' : ''}${ret.toFixed(2)}%`;
  retEl.style.color = bull ? 'var(--bull)' : 'var(--bear)';
}

/* ──────────────────────────────────────────────────────────
   HOLDINGS LIST
   ────────────────────────────────────────────────────────── */
function renderHoldings() {
  const list    = document.getElementById('holdings-list');
  const entries = Object.entries(state.holdings).filter(([, h]) => h.qty > 0);

  if (entries.length === 0) {
    list.innerHTML = '<div class="no-holdings">No positions yet</div>';
    return;
  }

  list.innerHTML = '';
  entries.forEach(([ticker, h]) => {
    const price = state.stocks[ticker].price;
    const value = h.qty * price;
    const cost  = h.qty * h.avgCost;
    const pnl   = value - cost;
    const pct   = pnl / cost * 100;
    const bull  = pnl >= 0;

    const el          = document.createElement('div');
    el.className      = 'holding-row';
    el.innerHTML = `
      <div>
        <div class="hr-top">
          <span class="hr-ticker">${ticker}</span>
          <span class="hr-qty">${h.qty} shares</span>
        </div>
        <div class="hr-avg">avg $${fmt2(h.avgCost)}</div>
      </div>
      <div>
        <div class="hr-value">$${fmt2(value)}</div>
        <div class="hr-pnl ${bull ? 'up' : 'dn'}">
          ${bull ? '+' : '-'}$${fmt2(Math.abs(pnl))}
          (${bull ? '+' : ''}${pct.toFixed(1)}%)
        </div>
      </div>
    `;
    list.appendChild(el);
  });
}

/* ──────────────────────────────────────────────────────────
   TRADE LOG
   ────────────────────────────────────────────────────────── */
function renderTradeLog() {
  const list = document.getElementById('trade-log');
  list.innerHTML = '';
  state.tradeLog.slice(0, 20).forEach(t => {
    const el      = document.createElement('div');
    el.className  = 'tl-item';
    el.innerHTML  = `
      <span class="tl-badge ${t.side}">${t.side.toUpperCase()}</span>
      <span class="tl-text"><strong>${t.qty}×${t.ticker}</strong> @ $${fmt2(t.price)}</span>
      <span class="tl-time">T${t.tick}</span>
    `;
    list.appendChild(el);
  });
}

/* ──────────────────────────────────────────────────────────
   REGIME LEGEND (bottom of right panel)
   ────────────────────────────────────────────────────────── */
function buildRegimeLegend() {
  const grid = document.getElementById('rl-grid');
  Object.entries(REGIMES).forEach(([, r]) => {
    const el      = document.createElement('div');
    el.className  = 'rl-item';
    el.innerHTML  = `<div class="rl-dot" style="background:${r.color}"></div>${r.label}`;
    grid.appendChild(el);
  });
}

/* ──────────────────────────────────────────────────────────
   BUY/SELL COST PREVIEW
   ────────────────────────────────────────────────────────── */
function updateCostPreview() {
  const ticker = state.selectedTicker;
  if (!ticker) return;
  const qty   = parseInt(document.getElementById('qty-input').value, 10) || 0;
  const price = state.stocks[ticker]?.price ?? 0;
  const total = qty * price;

  document.getElementById('cost-preview').innerHTML =
    `Cost: <strong>$${fmt2(total)}</strong>`;

  document.getElementById('btn-buy').disabled  = total > state.cash || qty <= 0;
  const h = state.holdings[ticker];
  document.getElementById('btn-sell').disabled = !h || h.qty < qty || qty <= 0;
}

/* ──────────────────────────────────────────────────────────
   CHART HOVER TOOLTIP
   ────────────────────────────────────────────────────────── */
function initChartHover() {
  const body = document.getElementById('chart-body');

  body.addEventListener('mousemove', e => {
    const rect   = body.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const W      = body.clientWidth;
    const ticker = state.selectedTicker;
    const hist   = state.stocks[ticker].history;
    const PAD_L  = 8;
    const PAD_R  = 62;
    const cW     = W - PAD_L - PAD_R;
    const sp     = cW / hist.length;
    const idx    = Math.floor((mx - PAD_L) / sp);
    const info   = document.getElementById('chart-hover-info');

    if (idx >= 0 && idx < hist.length) {
      const c      = hist[idx];
      const bull   = c.c >= c.o;
      const chgPct = ((c.c - c.o) / c.o * 100).toFixed(2);
      info.style.display = 'block';
      info.innerHTML = `
        <span style="color:var(--muted)">T-${hist.length - idx}</span><br>
        <span style="color:var(--muted)">O</span> <strong>$${fmt2(c.o)}</strong>
        &nbsp;
        <span style="color:var(--muted)">H</span> <strong style="color:var(--bull)">$${fmt2(c.h)}</strong><br>
        <span style="color:var(--muted)">L</span> <strong style="color:var(--bear)">$${fmt2(c.l)}</strong>
        &nbsp;
        <span style="color:var(--muted)">C</span> <strong>$${fmt2(c.c)}</strong><br>
        <span style="${bull ? 'color:var(--bull)' : 'color:var(--bear)'}">
          ${bull ? '▲' : '▼'} ${chgPct}%
        </span>
      `;
    } else {
      info.style.display = 'none';
    }
  });

  body.addEventListener('mouseleave', () => {
    document.getElementById('chart-hover-info').style.display = 'none';
  });
}

/* ──────────────────────────────────────────────────────────
   STOCK SELECTION
   ────────────────────────────────────────────────────────── */
function selectStock(ticker) {
  state.selectedTicker = ticker;
  updateUI();
}
