# 📈 TradeFloor — Stock Market Simulator

A browser-based stock market simulator to practice reading candlestick charts and learn trading fundamentals. No server needed — pure HTML, CSS, and JavaScript.

---

## 🚀 Live on GitHub Pages

**Deployment steps:**

1. **Fork or upload** this repository to GitHub
2. Go to your repo → **Settings** → **Pages**
3. Under *Source*, select **Deploy from a branch**
4. Choose `main` branch, `/ (root)` folder → **Save**
5. Wait ~60 seconds, then visit:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

That's it — no build step, no `npm install`.

---

## 📁 Project Structure

```
tradefloor/
├── index.html          ← Entry point
├── manifest.json       ← PWA manifest (installable as app)
├── css/
│   └── style.css       ← All styles (responsive: desktop + tablet + mobile)
├── js/
│   ├── data.js         ← Stock definitions & regime constants
│   ├── engine.js       ← Price engine, tick loop, portfolio & trading logic
│   ├── chart.js        ← Canvas rendering (candlestick, volume, sparklines, equity)
│   ├── ui.js           ← DOM updates (stock list, holdings, trade log, panels)
│   └── main.js         ← Entry point: event wiring, keyboard shortcuts, init
└── assets/
    ├── icon-192.png    ← PWA icon (add your own, or leave blank)
    └── icon-512.png    ← PWA icon
```

---

## 🎮 How to Use

### Starting balance
You begin with **$10,000** in virtual cash.

### Stocks & Behaviours
| Ticker | Name               | Regime          | What it does                        |
|--------|--------------------|-----------------|-------------------------------------|
| APXL   | Apex Technologies  | Trending Up     | Steady upward drift                 |
| VRTX   | Vertex Pharma      | Trending Down   | Steady downward drift               |
| ZNGR   | Zinger Energy      | Volatile        | Wild swings in both directions      |
| BLKR   | Blokr Financial    | Stable          | Low volatility, nearly flat         |
| MNGO   | Mango Retail Group | Boom & Bust     | Strong runs, then sharp crashes     |
| CRVX   | Curvex Analytics   | Mean-Reverting  | Drifts away from mean, snaps back   |
| DRFT   | Driftwood Media    | Random Walk     | Pure random movement                |
| NXUS   | Nexus Robotics     | Trending Up     | Faster upward trend                 |

### Trading
1. Click a stock on the left to open its chart
2. Enter the number of shares in the **Shares** box
3. Click **Buy** or **Sell** (the cost preview updates in real time)
4. The **dashed yellow line** on the chart shows your average purchase price
5. Watch your **P&L** and **equity curve** update in the right panel

### Controls
| Action              | How                                  |
|---------------------|--------------------------------------|
| Buy                 | Click Buy button or press **B**      |
| Sell                | Click Sell button or press **S**     |
| Pause / Resume      | Click button or press **Space**      |
| Switch stock        | Click card or press **← →** arrows  |
| Change speed        | Slow / Normal / Fast / Turbo buttons |

---

## 💡 Learning Tips

- **MNGO (Boom & Bust)**: Try to buy during the "neutral" phase and sell at the peak of the boom before it crashes.
- **ZNGR (Volatile)**: Watch the candlestick body vs. wick sizes — large wicks mean indecision.
- **BLKR (Stable)**: Good for practicing position sizing with low risk.
- **CRVX (Mean-Reverting)**: Buy when it drops far below its average; sell when it overshoots upward.

---

## 🛠 Run Locally (no internet needed)

Just open `index.html` directly in your browser — no server required.

If you want a local development server:
```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```
Then visit `http://localhost:8080`.

---

## 📱 Install as App (PWA)

On **iPad / tablet**: open the site in Safari → Share → *Add to Home Screen*

On **desktop Chrome**: look for the install icon (⊕) in the address bar

---

## 📝 Customising

To add your own stocks, edit `js/data.js`:

```js
const STOCK_DEFS = [
  // add a new entry:
  { ticker: 'MYCO', name: 'My Company', regime: 'volatile', startPrice: 75.00 },
  // ...
];
```

Available regimes: `trending_up`, `trending_down`, `volatile`, `stable`, `boom_bust`, `mean_revert`, `random_walk`

---

## 📄 Licence

MIT — free to use, modify, and share.
