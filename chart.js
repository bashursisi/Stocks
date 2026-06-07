/* ════════════════════════════════════════════════════════════
   chart.js — canvas rendering (main chart, volume, mini, equity)
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ── colour palette (mirrors CSS vars for canvas use) ── */
const C = {
  bg:      '#07080c',
  s1:      '#0d0f16',
  b1:      '#1e2233',
  b2:      '#252a3a',
  muted:   '#5a6080',
  dim:     '#3a4060',
  bull:    '#00e07a',
  bear:    '#ff3d57',
  accent:  '#ffe040',
  bullDim: '#1a4a35',
  bearDim: '#4a1a20',
  bullFog: 'rgba(0,224,122,.07)',
  bearFog: 'rgba(255,61,87,.07)',
};

/* ──────────────────────────────────────────────────────────
   Utility: size a canvas to its container using device DPR
   ────────────────────────────────────────────────────────── */
function sizeCanvas(canvas, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

/* ──────────────────────────────────────────────────────────
   MAIN CANDLESTICK CHART
   ────────────────────────────────────────────────────────── */
function renderMainChart() {
  const ticker = state.selectedTicker;
  const s      = state.stocks[ticker];
  const r      = REGIMES[s.regime];
  const hist   = s.history;

  /* ── header ── */
  const prev   = hist.length > 1 ? hist[hist.length - 2].c : hist[0]?.o ?? s.price;
  const chg    = s.price - prev;
  const pct    = chg / prev * 100;
  const bull   = chg >= 0;

  document.getElementById('ch-ticker').textContent   = ticker;
  document.getElementById('ch-fullname').textContent = s.name;
  document.getElementById('ch-price').textContent    = '$' + fmt2(s.price);

  const chgEl     = document.getElementById('ch-chg');
  chgEl.textContent = `${bull ? '▲' : '▼'} ${bull ? '+' : '-'}$${fmt2(Math.abs(chg))} (${bull ? '+' : ''}${pct.toFixed(2)}%)`;
  chgEl.style.color = bull ? 'var(--bull)' : 'var(--bear)';

  const badge   = document.getElementById('ch-regime-badge');
  badge.textContent = `${r.label} — ${r.desc}`;
  badge.style.cssText = `background:${r.color}18;color:${r.color};border:1px solid ${r.color}55;`;

  /* ── canvas ── */
  const body   = document.getElementById('chart-body');
  const canvas = document.getElementById('mainChart');
  const W = body.clientWidth;
  const H = body.clientHeight;
  if (W <= 0 || H <= 0) return;
  const ctx = sizeCanvas(canvas, W, H);

  const PAD  = { top: 16, right: 62, bottom: 28, left: 8 };
  const cW   = W - PAD.left - PAD.right;
  const cH   = H - PAD.top  - PAD.bottom;
  const n    = hist.length;

  const spacing = cW / n;
  const barW    = Math.max(2, Math.min(14, Math.floor(spacing) - 1));

  /* price range */
  let pMax = Math.max(...hist.map(c => c.h));
  let pMin = Math.min(...hist.map(c => c.l));
  const pad = (pMax - pMin) * 0.07;
  pMax += pad; pMin -= pad;
  const pY = p => PAD.top + cH * (1 - (p - pMin) / (pMax - pMin));
  const cX = i => PAD.left + (i + 0.5) * spacing;

  /* background */
  ctx.fillStyle = C.s1;
  ctx.fillRect(0, 0, W, H);

  /* grid lines */
  ctx.strokeStyle = C.b1;
  ctx.lineWidth   = 0.5;
  const gridN = 5;
  for (let i = 0; i <= gridN; i++) {
    const p = pMin + (pMax - pMin) * (i / gridN);
    const y = pY(p);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
    ctx.fillStyle  = C.muted;
    ctx.font       = '9px IBM Plex Mono, monospace';
    ctx.textAlign  = 'left';
    ctx.fillText('$' + fmt2(p), W - PAD.right + 4, y + 3.5);
  }

  /* average-cost line for current holding */
  const holding = state.holdings[ticker];
  if (holding?.qty > 0) {
    const ay = pY(holding.avgCost);
    ctx.save();
    ctx.strokeStyle = C.accent + '99';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, ay);
    ctx.lineTo(W - PAD.right, ay);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle  = C.accent;
    ctx.font       = '8px IBM Plex Mono, monospace';
    ctx.textAlign  = 'left';
    ctx.fillText('avg $' + fmt2(holding.avgCost), W - PAD.right + 4, ay + 3.5);
    ctx.restore();
  }

  /* candles */
  hist.forEach((c, i) => {
    const x    = cX(i);
    const bull = c.c >= c.o;
    const col  = bull ? C.bull : C.bear;
    const dim  = bull ? C.bullDim : C.bearDim;
    const last = (i === n - 1);

    /* wick */
    ctx.strokeStyle = col;
    ctx.lineWidth   = last ? 1.4 : 0.9;
    ctx.beginPath();
    ctx.moveTo(x, pY(c.h));
    ctx.lineTo(x, pY(c.l));
    ctx.stroke();

    /* body */
    const bTop = pY(Math.max(c.o, c.c));
    const bBot = pY(Math.min(c.o, c.c));
    const bH   = Math.max(1, bBot - bTop);
    ctx.fillStyle   = last ? col : dim;
    ctx.fillRect(x - barW / 2, bTop, barW, bH);
    ctx.strokeStyle = col;
    ctx.lineWidth   = last ? 1.5 : 0.6;
    ctx.strokeRect(x - barW / 2, bTop, barW, bH);
  });

  /* x-axis labels */
  ctx.fillStyle  = C.muted;
  ctx.font       = '9px IBM Plex Mono, monospace';
  ctx.textAlign  = 'center';
  const step = Math.max(1, Math.floor(n / 8));
  for (let i = 0; i < n; i += step) {
    ctx.fillText('T-' + (n - i), cX(i), H - PAD.bottom + 14);
  }
}

/* ──────────────────────────────────────────────────────────
   VOLUME CHART
   ────────────────────────────────────────────────────────── */
function renderVolume() {
  const ticker = state.selectedTicker;
  const hist   = state.stocks[ticker].history;
  const area   = document.getElementById('vol-area');
  const canvas = document.getElementById('volChart');
  const W = area.clientWidth;
  const H = area.clientHeight;
  if (W <= 0 || H <= 0) return;
  const ctx = sizeCanvas(canvas, W, H);

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const n   = hist.length;
  const sp  = W / n;
  const bW  = Math.max(1, sp - 1);
  const mxV = Math.max(...hist.map(c => c.v));

  hist.forEach((c, i) => {
    const x  = (i + 0.5) * sp;
    const bh = (c.v / mxV) * (H - 4);
    ctx.fillStyle = c.c >= c.o
      ? 'rgba(0,224,122,.22)'
      : 'rgba(255,61,87,.22)';
    ctx.fillRect(x - bW / 2, H - bh, bW, bh);
  });
}

/* ──────────────────────────────────────────────────────────
   MINI SPARKLINE (stock list cards)
   ────────────────────────────────────────────────────────── */
function renderMiniChart(ticker) {
  const canvas = document.getElementById('mini-' + ticker);
  if (!canvas) return;

  const parent = canvas.parentElement;
  const W = parent.clientWidth - 32;   // subtract card padding
  const H = 26;
  if (W <= 0) return;
  const ctx = sizeCanvas(canvas, W, H);

  const hist   = state.stocks[ticker].history.slice(-30);
  const closes = hist.map(c => c.c);
  const mn     = Math.min(...closes);
  const mx     = Math.max(...closes);
  const range  = mx - mn || 1;
  const bull   = closes[closes.length - 1] >= closes[0];
  const col    = bull ? C.bull : C.bear;

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.2;
  ctx.beginPath();
  closes.forEach((v, i) => {
    const x = (i / (closes.length - 1)) * (W - 2) + 1;
    const y = H - 2 - ((v - mn) / range) * (H - 4);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  /* fill */
  const lastX = (W - 2) + 1;
  ctx.lineTo(lastX, H);
  ctx.lineTo(1, H);
  ctx.closePath();
  ctx.fillStyle = bull ? 'rgba(0,224,122,.08)' : 'rgba(255,61,87,.08)';
  ctx.fill();
}

/* ──────────────────────────────────────────────────────────
   EQUITY CURVE (portfolio history)
   ────────────────────────────────────────────────────────── */
function renderEquityChart() {
  const canvas = document.getElementById('equityChart');
  const wrap   = canvas.parentElement;
  const W = wrap.clientWidth;
  const H = 52;
  if (W <= 0) return;
  const ctx = sizeCanvas(canvas, W, H);

  ctx.clearRect(0, 0, W, H);

  const vals = state.equityHistory;
  if (vals.length < 2) return;

  const mn   = Math.min(...vals);
  const mx   = Math.max(...vals);
  const range = mx - mn || 1;
  const bull  = vals[vals.length - 1] >= vals[0];
  const col   = bull ? C.bull : C.bear;

  /* baseline (starting cash) */
  const baseY = H - 2 - ((STARTING_CASH - mn) / range) * (H - 4);
  ctx.save();
  ctx.strokeStyle = C.b1;
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(1, baseY);
  ctx.lineTo(W - 1, baseY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  /* line */
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = (i / (vals.length - 1)) * (W - 2) + 1;
    const y = H - 2 - ((v - mn) / range) * (H - 4);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  /* fill */
  ctx.lineTo(W - 1, H);
  ctx.lineTo(1, H);
  ctx.closePath();
  ctx.fillStyle = bull ? C.bullFog : C.bearFog;
  ctx.fill();
}
