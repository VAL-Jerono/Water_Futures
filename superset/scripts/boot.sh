#!/usr/bin/env bash
# Water Futures — Superset bootstrap (runs inside wf_superset container)
set -e
pip install psycopg2-binary -q
superset db upgrade
superset fab create-admin --username admin --firstname Admin --lastname User \
  --email admin@waterfutures.or.ke --password admin 2>/dev/null || true
superset fab reset-password --username admin --password admin 2>/dev/null || true
superset init
echo '--- Loading county data into the data home (Supabase or local fallback)...'
python /scripts/load_data.py
echo '--- Building Water Futures dashboard...'
python /scripts/build_water_dashboard.py
exec superset run -h 0.0.0.0 -p 8088 --with-threads