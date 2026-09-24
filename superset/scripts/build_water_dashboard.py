#!/usr/bin/env python3
"""
Water Futures — Superset Dashboard Builder
==========================================
Creates the DB connection, datasets, ~30 charts and a 5-tab dashboard:

  Tab 1  The Problem          — why this is worth solving (funding gap, exposure)
  Tab 2  Urgency Ranking      — which counties first (population-weighted AI score)
  Tab 3  Governance & Equity  — WGS, equity flags, intervention mix
  Tab 4  Model & Method       — ROC/PR/SHAP-driven metrics, transparency
  Tab 5  Business & Panel     — users, market, revenue, unfair advantage, verdict

Data home: Supabase (water schema) when SUPABASE_DB_URI is set, else local
Postgres. Pattern mirrors the CRD-TB stack (ORM-based, idempotent).
"""
import json
import os
import sys

from superset import create_app

app = create_app()

with app.app_context():
    from superset import db, security_manager as sm
    from superset.connectors.sqla.models import SqlaTable
    from superset.models.core import Database
    from superset.models.dashboard import Dashboard
    from superset.models.slice import Slice

    print("=" * 62)
    print("  WATER FUTURES — building dashboard (branch Jron)")
    print("=" * 62)

    # ── 1. Resolve data home & register the Supabase/local connection ────────
    supa_uri = os.getenv("SUPABASE_DB_URI", "").strip()
    if not supa_uri:
        host = os.getenv("SUPABASE_DB_HOST", "").strip()
        if host:
            from urllib.parse import quote_plus
            user = os.getenv("SUPABASE_DB_USER", "postgres").strip()
            pw = os.getenv("SUPABASE_DB_PASSWORD", "").strip()
            port = os.getenv("SUPABASE_DB_PORT", "5432").strip()
            dbname = os.getenv("SUPABASE_DB_NAME", "postgres").strip()
            supa_uri = f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(pw)}@{host}:{port}/{dbname}"
    if supa_uri and supa_uri.startswith("postgres://"):
        supa_uri = "postgresql+psycopg2://" + supa_uri[len("postgres://"):]
    if supa_uri and "sslmode=" not in supa_uri:
        supa_uri += ("&" if "?" in supa_uri else "?") + "sslmode=require"

    DB_NAME = "Water Futures Data Home"
    DATA_HOME_LABEL = "SUPABASE" if supa_uri else "LOCAL POSTGRES (fallback)"

    db_obj = db.session.query(Database).filter_by(database_name=DB_NAME).first()
    if db_obj:
        db_obj.sqlalchemy_uri = supa_uri or "postgresql+psycopg2://superset:superset_secret@postgres:5432/superset"
        print(f"Updated existing database connection → {DATA_HOME_LABEL}")
    else:
        db_obj = Database(database_name=DB_NAME, sqlalchemy_uri=supa_uri or "postgresql+psycopg2://superset:superset_secret@postgres:5432/superset")
        db.session.add(db_obj)
        db.session.flush()
        print(f"Created database connection → {DATA_HOME_LABEL}")

    # ── 2. Datasets ──────────────────────────────────────────────────────────
    counties_ds = db.session.query(SqlaTable).filter_by(
        database_id=db_obj.id, table_name="counties", schema="water").first()
    if not counties_ds:
        counties_ds = SqlaTable(
            database_id=db_obj.id, table_name="counties", schema="water",
            main_dttm_col=None)
    counties_ds.database = db_obj
    db.session.merge(counties_ds)
    db.session.flush()

    metrics_ds = db.session.query(SqlaTable).filter_by(
        database_id=db_obj.id, table_name="model_metrics", schema="water").first()
    if not metrics_ds:
        metrics_ds = SqlaTable(
            database_id=db_obj.id, table_name="model_metrics", schema="water")
    db.session.merge(metrics_ds)
    db.session.flush()

    C, M = counties_ds.id, metrics_ds.id

    # ── 3. Helpers ───────────────────────────────────────────────────────────
    def m(col, agg, lbl=None):
        return {"expressionType": "SIMPLE", "column": {"column_name": col}, "aggregate": agg,
                "label": lbl or f"{agg}({col})", "optionName": f"m_{agg}_{col}"}

    def sq(sql, lbl):
        k = lbl.lower().replace(" ", "_")[:30]
        return {"expressionType": "SQL", "sqlExpression": sql, "label": lbl, "optionName": f"sq_{k}"}

    def fq(col, op, val):
        return {"expressionType": "SIMPLE", "subject": col, "operator": op, "comparator": val,
                "clause": "WHERE", "filterOptionName": f"f_{col}_{op}"}

    SCHEMES = {1: "wfTab1Azure", 2: "wfTab2Coral", 3: "wfTab3Teal", 4: "wfTab4Indigo", 5: "wfTab5Amber"}

    AXIS_BAR = {
        "xAxisLabelRotation": 45, "truncateXAxis": True,
        "x_axis_label_margin": 14, "x_axis_title_margin": 28,
        "y_axis_title_margin": 45, "truncateYAxis": True,
        "y_axis_bounds": [0, None],
    }

    def slc(name, viz, ds, params, pg, desc="", tighten_axis=True):
        params.update({"viz_type": viz, "datasource": f"{ds}__table"})
        params.setdefault("adhoc_filters", [])
        params.setdefault("color_scheme", SCHEMES[pg])
        params.setdefault("rich_tooltip", True)
        if tighten_axis and viz in ("echarts_timeseries_bar", "echarts_timeseries_line"):
            for k, v in AXIS_BAR.items():
                params.setdefault(k, v)
        s = Slice(slice_name=name, viz_type=viz, datasource_id=ds,
                  datasource_type="table", params=json.dumps(params), description=desc)
        db.session.add(s); db.session.flush(); return s

    # ── 4. Tab 1 — The Problem (Azure) ───────────────────────────────────────
    print("Creating Tab 1 slices (The Problem, Azure)...")
    pg = 1
    s1_bn1 = slc("Citizens Facing Disruption (2026)", "big_number_total", M, {
        "metric": sq("MAX(disrupted_model_m) * 1000000", "Citizens Disrupted"),
        "subheader": "Model estimate 3.68M · narrative 3.99M — KHS 2023/24 + 2026 projections",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)
    s1_bn2 = slc("National Water Funding Gap (KSh B)", "big_number_total", M, {
        "metric": sq("MAX(gap_b_ksh)", "Funding Gap"),
        "subheader": "NAWASIP: under half of KSh 100B/yr for 2030 coverage received",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)
    s1_bn3 = slc("Counties Covered", "big_number_total", C, {
        "metric": m("county_name", "COUNT_DISTINCT", "Counties"),
        "subheader": "All 47 Kenyan counties in scope",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)
    s1_bn4 = slc("Households Surveyed", "big_number_total", M, {
        "metric": sq("MAX(households)", "Households"),
        "subheader": "KHS 2023/24 microdata, 528 attributes",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)

    # Disruption rate top counties
    s1_c1 = slc("Where Disruption Concentrates — Top 20 Counties (% HHs)", "echarts_timeseries_bar", C, {
        "x_axis": "county_name",
        "metrics": [sq("ROUND(100.0*MAX(disruption_rate),1)", "% HHs Disrupted")],
        "groupby": [], "row_limit": 20,
        "sort_by_metric": True, "show_legend": False, "show_value": True,
        "y_axis_format": ".1f", "xAxisTitle": "County", "yAxisTitle": "% households disrupted"
    }, pg)

    # Funding gap visual: annual need vs received
    s1_c2 = slc("The Allocation Gap — Needed vs Received (KSh B/yr)", "echarts_timeseries_bar", M, {
        "x_axis": "id",
        "metrics": [
            sq("MAX(annual_need_b_ksh)", "Needed / yr"),
            sq("MAX(received_b_ksh)", "Received / yr"),
        ],
        "groupby": [], "row_limit": 10,
        "show_legend": True, "show_value": True, "y_axis_format": "SMART_NUMBER",
        "xAxisTitle": "", "yAxisTitle": "KSh billions / year"
    }, pg)

    # Population exposure
    s1_c3 = slc("Citizens Disrupted 2026 — Top 20 Counties", "echarts_timeseries_bar", C, {
        "x_axis": "county_name",
        "metrics": [sq("MAX(citizens_disrupted_2026)", "Citizens (2026e)")],
        "groupby": [], "row_limit": 20,
        "sort_by_metric": True, "show_legend": False, "show_value": True,
        "y_axis_format": "SMART_NUMBER", "xAxisTitle": "County", "yAxisTitle": "Citizens (2026 est.)"
    }, pg)

    # Severity vs spread quadrant-style scatter
    s1_c4 = slc("Disruption Rate vs Critical-Vulnerability Share", "echarts_scatter", C, {
        "x_axis": "disruption_rate",
        "metrics": [m("pct_critical_wvi", "MAX", "Critical WVI share")],
        "groupby": ["county_name"], "row_limit": 47,
        "xAxisTitle": "% households disrupted", "yAxisTitle": "% in critical WVI"
    }, pg)
    # ── 5. Tab 2 — Urgency Ranking (Coral) ───────────────────────────────────
    print("Creating Tab 2 slices (Urgency Ranking, Coral)...")
    pg = 2
    s2_c1 = slc("Population-Weighted Urgency Score — All 47 Counties", "echarts_timeseries_bar", C, {
        "x_axis": "county_name",
        "metrics": [sq("ROUND(MAX(urgency_score),3)", "Urgency Score")],
        "groupby": [], "row_limit": 47,
        "sort_by_metric": True, "show_legend": False, "show_value": True,
        "y_axis_format": ".3f", "xAxisTitle": "", "yAxisTitle": "Urgency (0–1)"
    }, pg)

    s2_c2 = slc("County Urgency Mix by Tier", "pie", C, {
        "groupby": ["urgency_tier"], "metric": m("county_name", "COUNT_DISTINCT", "Counties"),
        "row_limit": 10, "show_labels": True, "pie_label_type": "key_percent",
        "label_line": True, "innerRadius": 35
    }, pg)

    s2_c3 = slc("Urgency Score vs Mean Predicted AI Risk", "echarts_scatter", C, {
        "x_axis": "mean_pred_risk",
        "metrics": [m("urgency_score", "MAX", "Urgency")],
        "groupby": ["county_name"], "row_limit": 47,
        "xAxisTitle": "Mean predicted disruption risk (SMOTE LightGBM)",
        "yAxisTitle": "Population-weighted urgency"
    }, pg)

    s2_c4 = slc("Priority Board — Top 15 (Explore + Sort)", "table", C, {
        "query_mode": "aggregate",
        "groupby": ["county_name", "urgency_tier", "primary_intervention"],
        "metrics": [
            sq("ROUND(MAX(urgency_score),3)", "Urgency"),
            sq("MAX(citizens_disrupted_2026)", "Citizens 2026e"),
            sq("ROUND(100.0*MAX(mean_pred_risk),1)", "AI Risk %"),
        ],
        "row_limit": 15
    }, pg, tighten_axis=False)

    s2_bn1 = slc("Nairobi's Share of National Disruption Volume", "big_number_total", C, {
        "metric": sq("ROUND(100.0*MAX(CASE WHEN county_name='Nairobi' THEN citizens_disrupted_2026 END)/SUM(citizens_disrupted_2026),1)", "Nairobi Share %"),
        "subheader": "2.07M of 3.68M citizens — one county, over half the volume",
        "y_axis_format": ".1f", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)

    s2_c5 = slc("Citizens Disrupted vs Citizens in Critical WVI (Top 20)", "echarts_timeseries_bar", C, {
        "x_axis": "county_name",
        "metrics": [
            sq("MAX(citizens_disrupted_2026)", "Disrupted (2026e)"),
            sq("MAX(citizens_critical_wvi_2026)", "Critical WVI (2026e)"),
        ],
        "groupby": [], "row_limit": 20, "sort_by_metric": True,
        "show_legend": True, "y_axis_format": "SMART_NUMBER",
        "xAxisTitle": "", "yAxisTitle": "Citizens (2026 est.)"
    }, pg)

    # ── 6. Tab 3 — Governance & Equity (Teal) ────────────────────────────────
    print("Creating Tab 3 slices (Governance & Equity, Teal)...")
    pg = 3
    s3_c1 = slc("Water Governance Score (WGS) — All Counties", "echarts_timeseries_bar", C, {
        "x_axis": "county_name",
        "metrics": [sq("ROUND(MAX(wgs),3)", "WGS")],
        "groupby": [], "row_limit": 47,
        "sort_by_metric": True, "show_legend": False,
        "y_axis_format": ".3f", "yAxisTitle": "WGS (0–1)"
    }, pg)

    s3_c2 = slc("Governance vs Household Vulnerability", "echarts_scatter", C, {
        "x_axis": "wgs",
        "metrics": [m("mean_wvi", "MAX", "Mean WVI")],
        "groupby": ["county_name"], "row_limit": 47,
        "xAxisTitle": "Water Governance Score", "yAxisTitle": "Mean household WVI"
    }, pg)

    s3_c3 = slc("Recommended Intervention Mix (47 counties)", "pie", C, {
        "groupby": ["primary_intervention"], "metric": m("county_name", "COUNT_DISTINCT", "Counties"),
        "row_limit": 10, "show_labels": True, "pie_label_type": "key",
        "label_line": True, "innerRadius": 35
    }, pg)

    s3_bn1 = slc("Equity-Flagged Counties", "big_number_total", C, {
        "metric": sq("SUM(CASE WHEN equity_flag THEN 1 ELSE 0 END)", "Equity Counties"),
        "subheader": "Kitui · Turkana · Makueni · Wajir — female-headed HH vulnerability",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)

    s3_bn2 = slc("Citizens in Critical Vulnerability (2026e)", "big_number_total", C, {
        "metric": sq("SUM(citizens_critical_wvi_2026)", "Critical WVI Citizens"),
        "subheader": "356K citizens in the most severe vulnerability band",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)

    s3_c4 = slc("Low-Governance Counties (WGS tier)", "table", C, {
        "query_mode": "aggregate",
        "groupby": ["county_name", "wgs_tier"],
        "metrics": [
            sq("ROUND(MAX(wgs),3)", "WGS"),
            sq("ROUND(100.0*MAX(disruption_rate),1)", "% Disrupted"),
            sq("ROUND(MAX(tariff),1)", "Tariff KSh"),
        ],
        "adhoc_filters": [fq("wgs_tier", "==", "Low Governance")],
        "row_limit": 10
    }, pg, tighten_axis=False)

    s3_c5 = slc("Do Efficient Counties Charge Fair Tariffs?", "echarts_scatter", C, {
        "x_axis": "efficiency",
        "metrics": [m("tariff", "MAX", "Tariff KSh")],
        "groupby": ["county_name"], "row_limit": 47,
        "xAxisTitle": "System efficiency (0–1)", "yAxisTitle": "Residential tariff (KSh)"
    }, pg)
    print("Creating Tab 4 slices (Model & Method, Indigo)...")
    pg = 4
    s4_bn1 = slc("Model ROC-AUC (SMOTE LightGBM)", "big_number_total", M, {
        "metric": sq("MAX(roc_auc)", "ROC-AUC"),
        "subheader": "vs 0.8866 logistic baseline · 96% overall accuracy",
        "y_axis_format": ".4f", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)
    s4_bn2 = slc("PR-AUC Uplift vs Baseline", "big_number_total", M, {
        "metric": sq("ROUND(100.0*(MAX(pr_auc)-MAX(pr_auc_baseline))/MAX(pr_auc_baseline),1)", "PR-AUC Uplift %"),
        "subheader": "0.4217 vs 0.2810 — SMOTE rescues the minority 4.02% class",
        "y_axis_format": ".1f", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)

    s4_c1 = slc("Discrimination: Model vs Baseline", "echarts_timeseries_bar", M, {
        "x_axis": "id",
        "metrics": [
            sq("MAX(roc_auc)", "SMOTE LightGBM ROC-AUC"),
            sq("MAX(roc_auc_baseline)", "Logistic ROC-AUC"),
            sq("MAX(pr_auc)", "SMOTE LightGBM PR-AUC"),
            sq("MAX(pr_auc_baseline)", "Logistic PR-AUC"),
        ],
        "groupby": [], "row_limit": 5, "show_value": True,
        "y_axis_format": ".4f", "yAxisTitle": "Score (0–1)"
    }, pg)

    s4_c2 = slc("What Drives Disruption (SHAP-Verified Drivers)", "echarts_timeseries_bar", C, {
        "x_axis": "county_name",
        "metrics": [
            sq("ROUND(MAX(mean_pred_risk),3)", "Mean predicted risk"),
            sq("ROUND(MAX(mean_wvi),3)", "Mean WVI"),
        ],
        "groupby": [], "row_limit": 10, "sort_by_metric": True,
        "show_legend": True, "y_axis_format": ".3f", "yAxisTitle": "Score"
    }, pg)

    s4_c4 = slc("Method Data — One Row Per County (SQL Lab-Ready)", "table", C, {
        "query_mode": "raw",
        "columns": ["county_name", "disruption_rate", "mean_wvi", "wgs", "mean_pred_risk", "urgency_score"],
        "row_limit": 50
    }, pg, tighten_axis=False)

    # ── 8. Tab 5 — Business & Panel (Amber) ──────────────────────────────────
    print("Creating Tab 5 slices (Business & Panel, Amber)...")
    pg = 5
    s5_bn1 = slc("Market: Counties in Scope", "big_number_total", C, {
        "metric": m("county_name", "COUNT_DISTINCT", "Counties"),
        "subheader": "47 counties · 55.69M citizens (2026 proj.) · KSh 465B gap",
        "y_axis_format": "SMART_NUMBER", "header_font_size": 0.30, "subheader_font_size": 0.12
    }, pg)

    s5_c1 = slc("Counties by Recommended Entry Package", "echarts_timeseries_bar", C, {
        "x_axis": "primary_intervention",
        "metrics": [m("county_name", "COUNT_DISTINCT", "Counties")],
        "groupby": [], "row_limit": 10, "show_value": True,
        "y_axis_format": "SMART_NUMBER", "yAxisTitle": "Counties"
    }, pg)

    s5_c2 = slc("Revenue-Ready Footprint: Tariff x Vulnerability", "echarts_scatter", C, {
        "x_axis": "tariff",
        "metrics": [m("mean_wvi", "MAX", "Mean WVI")],
        "groupby": ["county_name"], "row_limit": 47,
        "xAxisTitle": "Residential tariff (KSh)", "yAxisTitle": "Mean WVI"
    }, pg)

    s5_c3 = slc("Donor Pilot Map — Equity-Flagged Counties", "table", C, {
        "query_mode": "aggregate",
        "groupby": ["county_name", "primary_intervention"],
        "metrics": [
            sq("MAX(citizens_critical_wvi_2026)", "Critical WVI citizens"),
            sq("ROUND(MAX(mean_wvi),3)", "Mean WVI"),
            sq("ROUND(MAX(wgs),2)", "WGS"),
        ],
        "adhoc_filters": [fq("equity_flag", "==", True)],
        "row_limit": 10
    }, pg, tighten_axis=False)

    # ── 9. Narrative markdown (headers + callout boxes) ─────────────────────
    print("Creating narrative markdown...")
    H1_TEXT = (
        '<div style="background: linear-gradient(135deg, #075985 0%, #0284C7 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; box-shadow: 0 6px 18px rgba(2,132,199,0.25);">'
        '<h2 style="color:#fff;margin:0 0 4px;font-size:20px;font-weight:800;">1 · Why This Problem Is Worth Solving</h2>'
        '<h3 style="color:#fff;margin:0 0 6px;font-size:14px;font-weight:700;opacity:.95;">Kenya faces a KSh 465B water funding gap — so allocation defaults to politics, not measured need</h3>'
        '<p style="color:#fff;margin:0;font-size:12px;opacity:.9;">Under half of the KSh 100B needed yearly is received (NAWASIP). 3.99M citizens face disruptions, paying up to 4x tariffs to informal vendors. This tab quantifies the why.</p>'
        '</div>'
    )
    H1_BOX = (
        "### The Why — and the How\n"
        "**Why:** scarce funds are allocated by political visibility because need is unmeasured. "
        "**How:** a population-weighted AI urgency score (0.35×AI risk + 0.35×WVI + 0.15×(1−WGS) + 0.15×human volume) "
        "makes need measurable, transparent (SHAP) and comparable across all 47 counties."
    )

    H2_TEXT = (
        '<div style="background: linear-gradient(135deg, #991B1B 0%, #E11D48 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; box-shadow: 0 6px 18px rgba(225,29,72,0.25);">'
        '<h2 style="color:#fff;margin:0 0 4px;font-size:20px;font-weight:800;">2 · Which Counties First — Population-Weighted Urgency Ranking</h2>'
        '<h3 style="color:#fff;margin:0 0 6px;font-size:14px;font-weight:700;opacity:.95;">One transparent score: AI risk + vulnerability + governance gap + absolute human volume</h3>'
        '<p style="color:#fff;margin:0;font-size:12px;opacity:.9;">Nairobi is the only Critical-tier pie slice; 2.07M citizens. Nyamira, Samburu, Marsabit, Kisii follow as High tier.</p>'
        '</div>'
    )
    H2_BOX = (
        "### Reading the Ranking\n"
        "The urgency score deliberately weights **absolute citizens disrupted (15%)**, not just rates — "
        "preventing small-county bias. Equity-flagged counties surface here and on Tab 3 for targeted donor pilots."
    )

    H3_TEXT = (
        '<div style="background: linear-gradient(135deg, #134E4A 0%, #0D9488 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; box-shadow: 0 6px 18px rgba(13,148,136,0.25);">'
        '<h2 style="color:#fff;margin:0 0 4px;font-size:20px;font-weight:800;">3 · Governance & Equity — Who Is Being Left Behind</h2>'
        '<h3 style="color:#fff;margin:0 0 6px;font-size:14px;font-weight:700;opacity:.95;">8 counties in the Low-Governance band · 4 equity-flagged · 356K citizens in critical WVI</h3>'
        '<p style="color:#fff;margin:0;font-size:12px;opacity:.9;">WGS benchmarks county water offices (WASREB-style). Low governance + high vulnerability = urgent capacity building.</p>'
        '</div>'
    )
    H3_BOX = (
        "### Governance Is the Multiplier\n"
        "Infrastructure without governance reform decays. The 8 **Low-Governance** counties (Bomet 0.230 lowest) need "
        "**Governance Capacity Building** first; tariff outliers (Kitui, Bomet, Uasin Gishu) need **Tariff Reform**."
    )

    H4_TEXT = (
        '<div style="background: linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; box-shadow: 0 6px 18px rgba(124,58,237,0.25);">'
        '<h2 style="color:#fff;margin:0 0 4px;font-size:20px;font-weight:800;">4 · Model & Method — Why You Can Trust the Number</h2>'
        '<h3 style="color:#fff;margin:0 0 6px;font-size:14px;font-weight:700;opacity:.95;">SMOTE LightGBM · ROC-AUC 0.9205 · PR-AUC 0.4217 · SHAP-explainable · leakage-safe 70/15/15</h3>'
        '<p style="color:#fff;margin:0;font-size:12px;opacity:.9;">Trained on 21,347 KHS 2023/24 households (4.02% prevalence), SMOTE fitted on train split only, threshold tuned on validation at 0.4352.</p>'
        '</div>'
    )
    H4_BOX = (
        "### Transparency By Design\n"
        "Every score decomposes into auditable parts. SHAP shows **urban household flag, water-source risk, education, storage "
        "capacity** as top drivers. The full method table is exposed below for SQL Lab verification — no black boxes."
    )

    H5_TEXT = (
        '<div style="background: linear-gradient(135deg, #78350F 0%, #D97706 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; box-shadow: 0 6px 18px rgba(217,119,6,0.25);">'
        '<h2 style="color:#fff;margin:0 0 4px;font-size:20px;font-weight:800;">5 · Business & Panel Response — Users, Market, Revenue, Advantage</h2>'
        '<h3 style="color:#fff;margin:0 0 6px;font-size:14px;font-weight:700;opacity:.95;">Addressing the Maji Metrics panel review point by point</h3>'
        '<p style="color:#fff;margin:0;font-size:12px;opacity:.9;">Users: county water/finance depts, National Treasury, WASREB, WASH donors (KfW, World Bank) · Market: all 47 counties · Live product: water-futures.vercel.app</p>'
        '</div>'
    )
    H5_BOX = (
        "### Panel Verdict (Maji Metrics Review)\n"
        "✅ **Aligned to the theme** — data & AI informing water-investment allocation. "
        "✅ **Evidence of private sector & government partnerships** — B2G + donor revenue lines. "
        "**Unfair advantage:** we pitch a live working product, not slides."
    )

    # ── 10. Layout assembly (tabbed, symmetric) ──────────────────────────────
    print("Assembling layout...")
    pos = {
        "DASHBOARD_VERSION_KEY": "v2",
        "ROOT_ID": {"children": ["GRID_ID"], "id": "ROOT_ID", "type": "ROOT"},
        "GRID_ID": {"children": ["TABS-HDR"], "id": "GRID_ID", "parents": ["ROOT_ID"], "type": "GRID"},
        "TABS-HDR": {"children": ["TAB-P1", "TAB-P2", "TAB-P3", "TAB-P4", "TAB-P5"],
                     "id": "TABS-HDR", "parents": ["ROOT_ID", "GRID_ID"], "type": "TABS"},
    }

    def row(row_id, tab_id, children_ids):
        pos[row_id] = {"children": children_ids, "id": row_id,
                       "meta": {"background": "BACKGROUND_TRANSPARENT"},
                       "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR", tab_id], "type": "ROW"}

    def md(md_id, tab_id, row_id, code, height, width):
        pos[md_id] = {"children": [], "id": md_id,
                      "meta": {"code": code, "height": height, "width": width},
                      "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR", tab_id, row_id], "type": "MARKDOWN"}

    def chart(ch_id, tab_id, row_id, slice_obj, height, width):
        pos[ch_id] = {"children": [], "id": ch_id,
                      "meta": {"chartId": slice_obj.id, "height": height, "sliceName": slice_obj.slice_name, "width": width},
                      "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR", tab_id, row_id], "type": "CHART"}

    H_TITLE, H_KPI, H_PAIR, H_FULL, H_BOX = 10, 18, 44, 48, 11

    # Tab 1
    tab = "TAB-P1"
    pos[tab] = {"children": ["ROW-P1-1", "ROW-P1-2", "ROW-P1-3", "ROW-P1-4", "ROW-P1-5"], "id": tab,
                "meta": {"text": "1. The Problem"}, "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR"], "type": "TAB"}
    row("ROW-P1-1", tab, ["MD-P1-HDR"]); md("MD-P1-HDR", tab, "ROW-P1-1", H1_TEXT, H_TITLE, 12)
    row("ROW-P1-2", tab, [f"CH-{s1_bn1.id}", f"CH-{s1_bn2.id}", f"CH-{s1_bn3.id}", f"CH-{s1_bn4.id}"])
    for sid in (s1_bn1, s1_bn2, s1_bn3, s1_bn4):
        chart(f"CH-{sid.id}", tab, "ROW-P1-2", sid, H_KPI, 3)
    row("ROW-P1-3", tab, [f"CH-{s1_c1.id}", f"CH-{s1_c3.id}"])
    chart(f"CH-{s1_c1.id}", tab, "ROW-P1-3", s1_c1, H_PAIR, 6)
    chart(f"CH-{s1_c3.id}", tab, "ROW-P1-3", s1_c3, H_PAIR, 6)
    row("ROW-P1-4", tab, [f"CH-{s1_c2.id}", f"CH-{s1_c4.id}"])
    chart(f"CH-{s1_c2.id}", tab, "ROW-P1-4", s1_c2, H_PAIR, 6)
    chart(f"CH-{s1_c4.id}", tab, "ROW-P1-4", s1_c4, H_PAIR, 6)
    row("ROW-P1-5", tab, ["MD-P1-BOX"]); md("MD-P1-BOX", tab, "ROW-P1-5", H1_BOX, H_BOX, 12)

    # Tab 2
    tab = "TAB-P2"
    pos[tab] = {"children": ["ROW-P2-1", "ROW-P2-2", "ROW-P2-3", "ROW-P2-4", "ROW-P2-5", "ROW-P2-6"], "id": tab,
                "meta": {"text": "2. Urgency Ranking"}, "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR"], "type": "TAB"}
    row("ROW-P2-1", tab, ["MD-P2-HDR"]); md("MD-P2-HDR", tab, "ROW-P2-1", H2_TEXT, H_TITLE, 12)
    row("ROW-P2-2", tab, [f"CH-{s2_bn1.id}"])
    chart(f"CH-{s2_bn1.id}", tab, "ROW-P2-2", s2_bn1, 14, 12)
    row("ROW-P2-3", tab, [f"CH-{s2_c1.id}"])
    chart(f"CH-{s2_c1.id}", tab, "ROW-P2-3", s2_c1, H_FULL, 12)
    row("ROW-P2-4", tab, [f"CH-{s2_c2.id}", f"CH-{s2_c3.id}"])
    chart(f"CH-{s2_c2.id}", tab, "ROW-P2-4", s2_c2, H_PAIR, 5)
    chart(f"CH-{s2_c3.id}", tab, "ROW-P2-4", s2_c3, H_PAIR, 7)
    row("ROW-P2-5", tab, [f"CH-{s2_c5.id}"])
    chart(f"CH-{s2_c5.id}", tab, "ROW-P2-5", s2_c5, H_PAIR, 12)
    row("ROW-P2-6", tab, [f"CH-{s2_c4.id}"])
    chart(f"CH-{s2_c4.id}", tab, "ROW-P2-6", s2_c4, 30, 12)

    # Tab 3
    tab = "TAB-P3"
    pos[tab] = {"children": ["ROW-P3-1", "ROW-P3-2", "ROW-P3-3", "ROW-P3-4", "ROW-P3-5"], "id": tab,
                "meta": {"text": "3. Governance & Equity"}, "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR"], "type": "TAB"}
    row("ROW-P3-1", tab, ["MD-P3-HDR"]); md("MD-P3-HDR", tab, "ROW-P3-1", H3_TEXT, H_TITLE, 12)
    row("ROW-P3-2", tab, [f"CH-{s3_bn1.id}", f"CH-{s3_bn2.id}"])
    chart(f"CH-{s3_bn1.id}", tab, "ROW-P3-2", s3_bn1, H_KPI, 6)
    chart(f"CH-{s3_bn2.id}", tab, "ROW-P3-2", s3_bn2, H_KPI, 6)
    row("ROW-P3-3", tab, [f"CH-{s3_c1.id}", f"CH-{s3_c2.id}"])
    chart(f"CH-{s3_c1.id}", tab, "ROW-P3-3", s3_c1, H_PAIR, 7)
    chart(f"CH-{s3_c2.id}", tab, "ROW-P3-3", s3_c2, H_PAIR, 5)
    row("ROW-P3-4", tab, [f"CH-{s3_c3.id}", f"CH-{s3_c5.id}"])
    chart(f"CH-{s3_c3.id}", tab, "ROW-P3-4", s3_c3, H_PAIR, 5)
    chart(f"CH-{s3_c5.id}", tab, "ROW-P3-4", s3_c5, H_PAIR, 7)
    row("ROW-P3-5", tab, [f"CH-{s3_c4.id}"])
    chart(f"CH-{s3_c4.id}", tab, "ROW-P3-5", s3_c4, 22, 12)

    # Tab 4 layout
    tab = "TAB-P4"
    pos[tab] = {"children": ["ROW-P4-1", "ROW-P4-2", "ROW-P4-3", "ROW-P4-4"], "id": tab,
                "meta": {"text": "4. Model & Method"}, "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR"], "type": "TAB"}
    row("ROW-P4-1", tab, ["MD-P4-HDR"]); md("MD-P4-HDR", tab, "ROW-P4-1", H4_TEXT, H_TITLE, 12)
    row("ROW-P4-2", tab, [f"CH-{s4_bn1.id}", f"CH-{s4_bn2.id}"])
    chart(f"CH-{s4_bn1.id}", tab, "ROW-P4-2", s4_bn1, H_KPI, 6)
    chart(f"CH-{s4_bn2.id}", tab, "ROW-P4-2", s4_bn2, H_KPI, 6)
    row("ROW-P4-3", tab, [f"CH-{s4_c1.id}", f"CH-{s4_c2.id}"])
    chart(f"CH-{s4_c1.id}", tab, "ROW-P4-3", s4_c1, H_PAIR, 5)
    chart(f"CH-{s4_c2.id}", tab, "ROW-P4-3", s4_c2, H_PAIR, 7)
    row("ROW-P4-4", tab, [f"CH-{s4_c4.id}"])
    chart(f"CH-{s4_c4.id}", tab, "ROW-P4-4", s4_c4, 30, 12)

    # Tab 5 layout
    tab = "TAB-P5"
    pos[tab] = {"children": ["ROW-P5-1", "ROW-P5-2", "ROW-P5-3", "ROW-P5-4"], "id": tab,
                "meta": {"text": "5. Business & Panel"}, "parents": ["ROOT_ID", "GRID_ID", "TABS-HDR"], "type": "TAB"}
    row("ROW-P5-1", tab, ["MD-P5-HDR"]); md("MD-P5-HDR", tab, "ROW-P5-1", H5_TEXT, H_TITLE, 12)
    row("ROW-P5-2", tab, [f"CH-{s5_bn1.id}"])
    chart(f"CH-{s5_bn1.id}", tab, "ROW-P5-2", s5_bn1, H_KPI, 12)
    row("ROW-P5-3", tab, [f"CH-{s5_c1.id}", f"CH-{s5_c2.id}"])
    chart(f"CH-{s5_c1.id}", tab, "ROW-P5-3", s5_c1, H_PAIR, 6)
    chart(f"CH-{s5_c2.id}", tab, "ROW-P5-3", s5_c2, H_PAIR, 6)
    row("ROW-P5-4", tab, ["MD-P5-BOX", f"CH-{s5_c3.id}"])
    md("MD-P5-BOX", tab, "ROW-P5-4", H5_BOX, 26, 6)
    chart(f"CH-{s5_c3.id}", tab, "ROW-P5-4", s5_c3, 26, 6)

    # ── 11. CSS (dash.css — the only place Superset reads it from) ───────────
    print("Applying CSS...")
    TAB_COLORS = {
        1: ("#075985", "#0284C7"), 2: ("#991B1B", "#E11D48"), 3: ("#134E4A", "#0D9488"),
        4: ("#4C1D95", "#7C3AED"), 5: ("#78350F", "#D97706"),
    }
    css_parts = [
        ".chart-slice { border-radius: 12px !important; box-shadow: 0 4px 14px rgba(0,0,0,0.06) !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; overflow: hidden !important; }",
        ".dashboard-markdown { border-radius: 12px !important; overflow: hidden !important; }",
    ]
    for i, (c1, c2) in TAB_COLORS.items():
        css_parts.append(
            f".tab-pane:nth-child({i}), #TAB-P{i} {{ background: linear-gradient(180deg, {c1}0D 0%, transparent 240px) !important; }}")
        css_parts.append(
            f".dashboard-component-tabs .nav-tabs .nav-item:nth-child({i}) .nav-link {{ color: {c1} !important; background: {c2}1A !important; }}")
        css_parts.append(
            f".dashboard-component-tabs .nav-tabs .nav-item:nth-child({i}) .nav-link.active {{ background: linear-gradient(135deg, {c1} 0%, {c2} 100%) !important; color: #fff !important; font-weight: 800 !important; box-shadow: 0 -2px 8px {c2}4D !important; }}")
    for sid, (c1, c2) in {
        s1_bn1: TAB_COLORS[1], s1_bn2: TAB_COLORS[1], s1_bn3: TAB_COLORS[1], s1_bn4: TAB_COLORS[1],
        s1_c1: TAB_COLORS[1], s1_c3: TAB_COLORS[1], s1_c2: TAB_COLORS[1], s1_c4: TAB_COLORS[1],
        s2_c1: TAB_COLORS[2], s2_c2: TAB_COLORS[2], s2_c3: TAB_COLORS[2], s2_c5: TAB_COLORS[2],
        s2_bn1: TAB_COLORS[2], s2_c4: TAB_COLORS[2],
        s3_c1: TAB_COLORS[3], s3_c2: TAB_COLORS[3], s3_c3: TAB_COLORS[3], s3_c5: TAB_COLORS[3],
        s3_bn1: TAB_COLORS[3], s3_bn2: TAB_COLORS[3], s3_c4: TAB_COLORS[3],
        s4_bn1: TAB_COLORS[4], s4_bn2: TAB_COLORS[4], s4_c1: TAB_COLORS[4], s4_c2: TAB_COLORS[4], s4_c4: TAB_COLORS[4],
        s5_bn1: TAB_COLORS[5], s5_c1: TAB_COLORS[5], s5_c2: TAB_COLORS[5], s5_c3: TAB_COLORS[5],
    }.items():
        css_parts.append(
            f"#CH-{sid.id} .header-title, #CH-{sid.id} [data-test='slice-header'], #CH-{sid.id} .chart-header {{ background: linear-gradient(135deg, {c1} 0%, {c2} 100%) !important; color: #fff !important; padding: 10px 14px !important; border-radius: 8px 8px 0 0 !important; }}")
        css_parts.append(
            f"#CH-{sid.id} .header-title *, #CH-{sid.id} [data-test='slice-header'] * {{ color: #fff !important; }}")
        css_parts.append(
            f"#CH-{sid.id} .chart-slice {{ border-top: 4px solid {c2} !important; }}")
    css_parts.append(
        ".chart-slice .dt-bootstrap4 thead th { background: #f8fafc !important; font-weight: 700 !important; font-size: 12px !important; color: #334155 !important; text-transform: uppercase !important; }")
    css_parts.append(
        ".chart-slice .dt-bootstrap4 tbody tr:hover td { background: rgba(2,132,199,0.06) !important; }")
    MASTER_CSS = "\n".join(css_parts)

    # ── 12. Create dashboard (idempotent by slug) ────────────────────────────
    all_slices = [s1_bn1, s1_bn2, s1_bn3, s1_bn4, s1_c1, s1_c2, s1_c3, s1_c4,
                  s2_c1, s2_c2, s2_c3, s2_c4, s2_bn1, s2_c5,
                  s3_c1, s3_c2, s3_c3, s3_bn1, s3_bn2, s3_c4, s3_c5,
                  s4_bn1, s4_bn2, s4_c1, s4_c2, s4_c4,
                  s5_bn1, s5_c1, s5_c2, s5_c3]

    dash = db.session.query(Dashboard).filter_by(slug="water_futures_urgency").first()
    if dash:
        dash.slices = []
        db.session.commit()
    else:
        dash = Dashboard(dashboard_title="Water Futures — County Urgency Dashboard",
                         slug="water_futures_urgency", published=True)
        db.session.add(dash)

    dash.position_json = json.dumps(pos)
    dash.json_metadata = json.dumps({"color_scheme": "wfTab1Azure"})
    dash.css = MASTER_CSS
    dash.slices = all_slices
    db.session.commit()
    print(f"Dashboard saved (ID={dash.id}, {len(all_slices)} slices).")

    # ── 13. Public role permissions (shareable link) ─────────────────────────
    pub = sm.find_role("Public")
    if pub:
        pvms = sm.get_session.query(sm.permissionview_model).all()
        added = 0
        for pvm in pvms:
            pn = pvm.permission.name if pvm.permission else ""
            vn = pvm.view_menu.name if pvm.view_menu else ""
            if (pn in ["can_read", "can_show", "can_list", "can_dashboard", "can_explore"] or
                    "datasource access" in pn or "all_database_access" in pn or
                    vn in ["Dashboard", "Chart", "Superset", "Slice", "Dataset",
                           "DashboardModelView", "SliceModelView"]):
                if pvm not in pub.permissions:
                    pub.permissions.append(pvm)
                    added += 1
        db.session.commit()
        print(f"Public permissions updated: +{added} granted.")

    print()
    print("=" * 62)
    print("  SUCCESS — Water Futures dashboard rebuilt")
    print(f"  Data home : {DATA_HOME_LABEL}")
    print("  URL       : http://localhost:8091/superset/dashboard/water_futures_urgency/")
    print("  Login     : admin / admin (or use the Public share link)")
    print("=" * 62)