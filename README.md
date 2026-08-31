# Water Futures — County Intervention Dashboard

Minimal Next.js dashboard for the population-weighted water disruption
urgency scores by county.

## Files (7 total, no extras)
```
package.json
app/layout.js
app/page.js            <- the dashboard UI
app/globals.css
app/api/counties/route.js   <- serves the data; swap this later for a DB or live feed
data/counties.json      <- current model output, regenerate whenever you rerun the notebook
```

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel (first time)
1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Vercel auto-detects Next.js — click Deploy. No config needed.
4. Every future `git push` redeploys automatically.

Or from the CLI, inside this folder:
```
npx vercel
```

## Updating the data
Re-export `county_water_recommendations.csv` from the notebook, then
regenerate `data/counties.json` (county, urgencyScore, urgencyTier,
citizensDisrupted2026, citizensCriticalWvi2026, meanPredRisk, wgs, wgsTier,
primaryIntervention, equityFlag, pop2026Est — camelCase, sorted by
urgencyScore descending). Commit and push; Vercel redeploys automatically.

## Growing it later
- Swap `data/counties.json` for a real database call inside
  `app/api/counties/route.js` — the UI doesn't need to change.
- Add a map view, a per-county detail page, or auth for internal
  WASREB/Treasury use as separate routes under `app/`.
- Add a cron-triggered Vercel function to refresh scores automatically
  when a new KHS cycle lands.
