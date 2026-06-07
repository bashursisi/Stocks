/* ════════════════════════════════════════════════════════════
   data.js — stock definitions and regime constants
   ════════════════════════════════════════════════════════════ */

'use strict';

const STARTING_CASH = 10_000;
const HISTORY_LEN   = 120;

/**
 * Each regime defines how a stock's price moves each tick.
 *   drift  — baseline direction per tick (fractional)
 *   vol    — how much randomness to add
 */
const REGIMES = {
  trending_up: {
    label: 'Trending Up',
    color: '#00e07a',
    desc:  'Steady upward drift',
    drift: +0.008,
    vol:    0.012,
  },
  trending_down: {
    label: 'Trending Down',
    color: '#ff3d57',
    desc:  'Steady downward drift',
    drift: -0.008,
    vol:    0.012,
  },
  volatile: {
    label: 'Volatile',
    color: '#ffe040',
    desc:  'Wild swings both ways',
    drift:  0.000,
    vol:    0.040,
  },
  stable: {
    label: 'Stable',
    color: '#4d9fff',
    desc:  'Low volatility, flat',
    drift: +0.001,
    vol:    0.006,
  },
  boom_bust: {
    label: 'Boom & Bust',
    color: '#ff8c42',
    desc:  'Strong runs then crashes',
    drift:  0.000,
    vol:    0.020,
  },
  mean_revert: {
    label: 'Mean-Reverting',
    color: '#c17aff',
    desc:  'Snaps back to average',
    drift:  0.000,
    vol:    0.018,
  },
  random_walk: {
    label: 'Random Walk',
    color: '#78909c',
    desc:  'Pure random movement',
    drift:  0.000,
    vol:    0.022,
  },
};

const STOCK_DEFS = [
  { ticker: 'APXL', name: 'Apex Technologies',   regime: 'trending_up',   startPrice: 142.50 },
  { ticker: 'VRTX', name: 'Vertex Pharma',        regime: 'trending_down', startPrice:  88.30 },
  { ticker: 'ZNGR', name: 'Zinger Energy',        regime: 'volatile',      startPrice:  55.00 },
  { ticker: 'BLKR', name: 'Blokr Financial',      regime: 'stable',        startPrice: 200.00 },
  { ticker: 'MNGO', name: 'Mango Retail Group',   regime: 'boom_bust',     startPrice:  32.00 },
  { ticker: 'CRVX', name: 'Curvex Analytics',     regime: 'mean_revert',   startPrice: 110.00 },
  { ticker: 'DRFT', name: 'Driftwood Media',      regime: 'random_walk',   startPrice:  67.80 },
  { ticker: 'NXUS', name: 'Nexus Robotics',       regime: 'trending_up',   startPrice: 310.00 },
];
