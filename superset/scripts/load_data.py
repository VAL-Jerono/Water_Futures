#!/usr/bin/env python3
"""
Water Futures — Data Loader (Supabase = data home)

Loads county_water_recommendations.csv into the `water` schema of the resolved
data home: Supabase when SUPABASE_DB_URI / SUPABASE_DB_* env vars are set,
otherwise the stack's local Postgres container (offline fallback).
Runs inside the wf_superset container. Safe to re-run (idempotent).
"""
import csv
import os
import sys

import psycopg2

CSV_PATH = "/data/county_water_recommendations.csv"
SCHEMA = "water"
LOCAL_URI = "postgresql://superset:superset_secret@postgres:5432/superset"

COUNTY_COLS = [
    "county_name", "county_code", "disruption_rate", "mean_wvi",
    "pct_critical_wvi", "pct_piped", "pct_female_headed", "efficiency",
    "quality", "continuity", "tariff", "providers", "storage", "pipes",
    "pop_served", "n_eff", "n_qual", "n_cont", "n_prov", "n_stor",
    "n_pipe", "n_pop", "n_tariff", "n_disrupt", "wgs", "wgs_tier",
    "mean_pred_risk", "pop_2019", "pop_2026_est", "citizens_disrupted_2026",
    "citizens_critical_wvi_2026", "primary_intervention", "urgency_score",
    "urgency_tier", "equity_flag",
]

METRICS = {
    "households": 21347, "counties": 47, "prevalence_pct": 4.02,
    "roc_auc": 0.9205, "roc_auc_baseline": 0.8866,
    "pr_auc": 0.4217, "pr_auc_baseline": 0.2810,
    "accuracy_pct": 96, "decision_threshold": 0.4352,
    "gap_b_ksh": 465, "annual_need_b_ksh": 100, "received_b_ksh": 45,
    "tariff_multiplier": 4, "pop2026_m": 55.69,
    "disrupted_model_m": 3.68, "disrupted_narrative_m": 3.99,
}


def resolve_target():
    """Return (label, uri) for the resolved data home."""
    uri = os.getenv("SUPABASE_DB_URI", "").strip()
    if not uri:
        host = os.getenv("SUPABASE_DB_HOST", "").strip()
        if host:
            from urllib.parse import quote_plus
            user = os.getenv("SUPABASE_DB_USER", "postgres").strip()
            pw = os.getenv("SUPABASE_DB_PASSWORD", "").strip()
            port = os.getenv("SUPABASE_DB_PORT", "5432").strip()
            dbname = os.getenv("SUPABASE_DB_NAME", "postgres").strip()
            uri = f"postgresql://{quote_plus(user)}:{quote_plus(pw)}@{host}:{port}/{dbname}"
    if uri:
        if uri.startswith("postgresql+psycopg2://"):
            uri = "postgresql://" + uri[len("postgresql+psycopg2://"):]
        elif uri.startswith("postgres://"):
            uri = "postgresql://" + uri[len("postgres://"):]
        if "sslmode=" not in uri:
            uri += ("&" if "?" in uri else "?") + "sslmode=require"
        return "SUPABASE (data home)", uri
    return "LOCAL POSTGRES (fallback — set superset/.env for Supabase)", LOCAL_URI


def ensure_schema(cur):
    """Create the water schema and tables (idempotent)."""
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}")
    explicit = []
    for c in COUNTY_COLS:
        if c in ("county_name", "wgs_tier", "primary_intervention", "urgency_tier"):
            t = "text"
        elif c == "equity_flag":
            t = "boolean"
        elif c in ("pop_2019", "pop_2026_est", "citizens_disrupted_2026", "citizens_critical_wvi_2026"):
            t = "bigint"
        elif c in ("county_code", "providers"):
            t = "integer"
        else:
            t = "numeric"
        explicit.append(f"{c} {t}")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {SCHEMA}.counties ({', '.join(explicit)})")
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.model_metrics (
            id integer PRIMARY KEY,
            households numeric, counties numeric, prevalence_pct numeric,
            roc_auc numeric, roc_auc_baseline numeric,
            pr_auc numeric, pr_auc_baseline numeric,
            accuracy_pct numeric, decision_threshold numeric,
            gap_b_ksh numeric, annual_need_b_ksh numeric,
            received_b_ksh numeric, tariff_multiplier numeric,
            pop2026_m numeric, disrupted_model_m numeric,
            disrupted_narrative_m numeric
        )"""
    )


def load_counties(conn):
    """TRUNCATE + reload all 47 county rows from the mounted CSV."""
    with open(CSV_PATH, newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = [r for r in reader if r and r[0].strip()]
    if [h.strip().lower() for h in header] != [c.lower() for c in COUNTY_COLS]:
        print(f"ERROR: CSV header mismatch.\n  got:    {header}\n  expect: {COUNTY_COLS}")
        sys.exit(1)
    placeholders = ", ".join(["%s"] * len(COUNTY_COLS))
    insert = f"INSERT INTO {SCHEMA}.counties ({', '.join(COUNTY_COLS)}) VALUES ({placeholders})"
    with conn.cursor() as cur:
        cur.execute(f"TRUNCATE {SCHEMA}.counties")
        for r in rows:
            clean = [None if v.strip() == "" else v for v in r]
            cur.execute(insert, clean)
    return len(rows)


def upsert_metrics(conn):
    cols = ["id"] + list(METRICS.keys())
    vals = [1] + list(METRICS.values())
    assigns = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols[1:])
    sql = (
        f"INSERT INTO {SCHEMA}.model_metrics ({', '.join(cols)}) "
        f"VALUES ({', '.join(['%s'] * len(vals))}) "
        f"ON CONFLICT (id) DO UPDATE SET {assigns}"
    )
    with conn.cursor() as cur:
        cur.execute(sql, vals)


def main():
    label, uri = resolve_target()
    print(f"Data home → {label}")
    conn = psycopg2.connect(uri)
    try:
        with conn.cursor() as cur:
            ensure_schema(cur)
        n = load_counties(conn)
        upsert_metrics(conn)
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*), SUM(citizens_disrupted_2026) FROM {SCHEMA}.counties")
            cnt, disrupted = cur.fetchone()
            cur.execute("SELECT roc_auc, gap_b_ksh FROM water.model_metrics WHERE id=1")
            auc, gap = cur.fetchone()
        print(f"  counties: {cnt} rows | citizens_disrupted_2026 total: {disrupted:,}")
        print(f"  model_metrics: ROC-AUC {auc} | funding gap KSh {gap}B")
        print("Load complete.")
    except Exception as e:
        conn.rollback()
        print(f"LOAD FAILED: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()