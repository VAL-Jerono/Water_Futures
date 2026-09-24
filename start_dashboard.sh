#!/usr/bin/env bash
# ===========================================================================
# WATER FUTURES — Dashboard Launcher (data home: Supabase)
# Starts Postgres + Redis + Superset, loads county data into Supabase
# (or local fallback) and builds the 5-tab dashboard automatically.
# First run takes ~3-5 minutes; subsequent starts take ~45s.
# ===========================================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/superset"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  WATER FUTURES — Superset County Urgency Dashboard ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Please start Docker Desktop first."
  exit 1
fi

# Load Supabase credentials if present
if [ -f "${COMPOSE_DIR}/.env" ]; then
  echo "✓ Loaded superset/.env (Supabase credentials found)"
else
  echo "ℹ No superset/.env — using LOCAL Postgres fallback."
  echo "  For Supabase as data home: see superset/SUPABASE_SETUP.md"
fi

cd "${COMPOSE_DIR}"

# If Superset is already running, just report
if docker compose ps superset 2>/dev/null | grep -q "running"; then
  echo ""
  echo "Superset is already running → http://localhost:8091"
  echo "Dashboard : http://localhost:8091/superset/dashboard/water_futures_urgency/"
  echo "Login     : admin / admin"
  exit 0
fi

echo "Starting services (Postgres + Redis + Superset)..."
echo "First run will take 3-5 minutes to pull images, load data into the data home,"
echo "and auto-build the dashboard."
echo ""
docker compose up -d --remove-orphans

echo ""
echo "Services starting. Follow setup progress with:"
echo "  docker compose -f ${COMPOSE_DIR}/docker-compose.yml logs -f superset"
echo ""
echo "Superset will be available at: http://localhost:8091"
echo "Dashboard: http://localhost:8091/superset/dashboard/water_futures_urgency/"
echo "Credentials: admin / admin"
echo ""
echo "Useful commands:"
echo "  Stop all:    cd ${COMPOSE_DIR} && docker compose down"
echo "  Stop + wipe: cd ${COMPOSE_DIR} && docker compose down -v"
echo "  Logs:        cd ${COMPOSE_DIR} && docker compose logs -f"
echo "  Reload data: docker exec wf_superset python /scripts/load_data.py"