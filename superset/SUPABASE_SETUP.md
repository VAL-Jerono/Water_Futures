# 🌊 Supabase Setup — 5 minutes

Supabase is the **data home** for Water Futures: one hosted Postgres holding the
47-county urgency table. Superset (this stack) reads from it and builds the
dashboard automatically.

## Step 1 — Create the project
1. Go to **https://supabase.com** → sign in → **New project**.
2. Name: `water-futures` · Region: closest to you (e.g. `eu-central-1`) ·
   Set a **database password** you remember.

## Step 2 — Get the connection string
1. In the project: **⚙ Project Settings → Database → Connection string → URI**.
2. Choose the **Session Pooler** (port `5432`, works from any network/IPv4):
   ```
   postgresql://postgres.<PROJECT-REF>:<YOUR-PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
   ```
   (If your password has special characters like `@ # ?`, URL-encode them:
   `@`→`%40`, `#`→`%23`.)

## Step 3 — Drop it into the env file
```bash
cd /Users/leonida/Documents/code/Water_Futures
cp superset/.env.example superset/.env
# now edit superset/.env and paste your URI into SUPABASE_DB_URI
```
`.env` is git-ignored — credentials never leave your machine.

## Step 4 — Start the stack (loads data + builds dashboard)
```bash
./start_dashboard.sh
```
The launcher:
1. Connects to Supabase, creates `water.counties` + `water.model_metrics`, loads the CSV.
2. Starts Superset on **http://localhost:8091** (login `admin` / `admin`).
3. Points every dataset at Supabase and auto-builds the 5-tab dashboard.

To re-load fresh notebook output later: `docker exec wf_superset python /scripts/load_data.py`

## What if I skip Supabase?
The stack falls back to its local Docker Postgres (same schema, same CSV) so
demos work offline. The moment `SUPABASE_DB_URI` is present, Supabase becomes
the data home — no other changes needed.

---
**Manual fallback** (run the SQL yourself): open Supabase → **SQL Editor**, paste
`superset/postgres/init.sql` (adjust the COPY paths as noted in comments), run it,
then upload `Notebook/county_water_recommendations.csv` via the Table Editor.