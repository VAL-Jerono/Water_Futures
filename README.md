# Water Futures — County Intervention Dashboard

**Two products, one data home:**

1. **Live product** — the Next.js app in `app/` (deployed: https://water-futures.vercel.app/).
   Population-weighted water disruption urgency scores for Kenya's 47 counties.
2. **Review/panel dashboard** — an Apache Superset stack in `superset/` that presents the
   findings and answers the Maji Metrics panel review (problem, users, market, value prop,
   revenue, unfair advantage) as a 5-tab BI dashboard. **Supabase is the data home.**

## Quick start (Superset review dashboard)

```bash
./start_dashboard.sh
```

Open http://localhost:8091/superset/dashboard/water_futures_urgency/ (login `admin`/`admin`).
First run pulls images, loads `Notebook/county_water_recommendations.csv` into the data home
and auto-builds all 30 charts. Host ports: 5435 (Postgres) · 6382 (Redis) · 8091 (Superset) —
chosen not to clash with the CRD-TB stack.

## Supabase as data home (5 minutes)

The stack reads its county data from **Supabase** when credentials are present, and falls
back to its local Docker Postgres otherwise:

```bash
cp superset/.env.example superset/.env   # then paste your Session Pooler URI
./start_dashboard.sh
```

Full walkthrough: [`superset/SUPABASE_SETUP.md`](superset/SUPABASE_SETUP.md).
To refresh data after re-running the notebook:
`docker exec wf_superset python /scripts/load_data.py`

## Stack layout

```
start_dashboard.sh               one-command launcher
superset/
  docker-compose.yml             Postgres 15 + Redis 7 + Superset 4.0.2
  superset_config.py             water-themed palettes, public access, Redis cache
  scripts/load_data.py           CSV → water.counties + water.model_metrics (Supabase-aware)
  scripts/build_water_dashboard.py  ORM builder: 5 tabs, 30 charts, themed CSS
  scripts/boot.sh                container bootstrap sequence
  data/county_water_recommendations.csv  current model output (regenerate from notebook)
  SUPABASE_SETUP.md              Supabase walkthrough
  .env.example                   credential template (never commit .env)
app/                             Next.js live product (Vercel)
Notebook/                        WATER_FUTURES.ipynb + chart exports
Maji Metrics.pdf                 panel review this dashboard answers
```

## Dashboard tabs

| Tab | Answers |
|---|---|
| 1. The Problem | KSh 465B funding gap, 3.68–3.99M citizens disrupted, exposure concentration |
| 2. Urgency Ranking | Population-weighted score: `0.35×risk + 0.35×WVI + 0.15×(1−WGS) + 0.15×volume` |
| 3. Governance & Equity | WGS benchmark, 8 low-governance counties, 4 equity-flagged, intervention mix |
| 4. Model & Method | SMOTE LightGBM ROC-AUC 0.9205 vs 0.8866 baseline, PR-AUC 0.4217, 21,347 households |
| 5. Business & Panel | Users (counties/Treasury/WASREB/donors), market (47 counties), revenue lines, panel verdict |

## The Next.js app (live product)

```bash
npm install
npm run dev        # http://localhost:3000
```

`app/api/counties/route.js` serves `data/counties.json` — swap for Supabase later via the
same `water.counties` table. Deploy: push to GitHub → import in Vercel.

## Updating the data

Re-export `county_water_recommendations.csv` from the notebook, copy it to
`superset/data/` and `Notebook/`, then `docker exec wf_superset python /scripts/load_data.py`
and re-run the builder (`docker exec wf_superset python /scripts/build_water_dashboard.py`).

## Branch

Active work happens on **`Jron`**.
