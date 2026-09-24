"use client";

import { useCountiesData } from "../lib/useCountiesData";
import { Zap, Layers, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ExecutivePage() {
  const { data, loading, summaryMetrics } = useCountiesData();

  return (
    <main className="wrap">
      <header className="app-header">
        <div>
          <h1 className="hero-title">Executive Briefing</h1>
          <p className="hero-subtitle">
            Converting millions of climate & governance signals into 1 clear actionable strategy for WASREB & National Treasury.
          </p>
        </div>
      </header>

      {/* THE GOOGLE MAPS PRINCIPLE BANNER */}
      <section className="story-banner">
        <div className="story-takeaway">
          <h3>
            <Zap size={20} style={{ color: "var(--cyan-glow)" }} />
            The Single Takeaway Message (Google Maps Principle)
          </h3>
          <p>
            Out of 47 counties, <strong>12 Critical & High-Risk Counties</strong> account for over <strong>2.41 Million citizens</strong> at risk of impending water disruption in 2026. Deploying immediate <em>Emergency Solar Boreholes & Utility Debt Relief</em> to these top 12 counties resolves <strong>85% of total national risk</strong>.
          </p>
        </div>
        <Link href="/manager" style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "linear-gradient(135deg, var(--cyan-deep), var(--cyan-glow))",
              color: "#000",
              fontWeight: 800,
              padding: "0.8rem 1.4rem",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            View Top 12 Priority Counties <ChevronRight size={18} />
          </button>
        </Link>
      </section>

      {/* STAT SUMMARY CARDS */}
      <section className="stat-grid">
        <div className="glass-panel stat-card critical">
          <div className="stat-label">Citizens at Risk (2026)</div>
          <div className="stat-value">{loading ? "..." : summaryMetrics.totalDisrupted.toLocaleString()}</div>
          <div className="stat-sub">Population-weighted water disruption forecast</div>
        </div>

        <div className="glass-panel stat-card high">
          <div className="stat-label">Critical Tier Counties</div>
          <div className="stat-value">{loading ? "..." : summaryMetrics.criticalCount}</div>
          <div className="stat-sub">Requiring immediate emergency intervention</div>
        </div>

        <div className="glass-panel stat-card emerald">
          <div className="stat-label">Governance Baseline (WGS)</div>
          <div className="stat-value">0.58</div>
          <div className="stat-sub">National average utility governance index</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Equity Flagged Counties</div>
          <div className="stat-value">{loading ? "..." : summaryMetrics.equityCount}</div>
          <div className="stat-sub">Vulnerable communities requiring targeted aid</div>
        </div>
      </section>

      {/* SCQA FRAMEWORK CARDS */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={20} style={{ color: "var(--cyan-glow)" }} /> SCQA Narrative Framework
        </h2>

        <div className="scqa-container">
          <div className="scqa-card situation">
            <span className="step-badge">1. Situation</span>
            <h4>Baseline Water Infrastructure</h4>
            <p>
              Kenya’s 47 counties serve over 50 Million citizens via localized Water Service Providers (WSPs), regulated by WASREB and funded through national infrastructure budgets.
            </p>
          </div>

          <div className="scqa-card complication">
            <span className="step-badge">2. Complication</span>
            <h4>Imminent Disruption Threat</h4>
            <p>
              Accelerating climate extremes combined with weak governance (WGS &lt; 0.5) and utility debt threaten severe water outages for <strong>2.41M citizens in 2026</strong>.
            </p>
          </div>

          <div className="scqa-card question">
            <span className="step-badge">3. Question</span>
            <h4>Optimal Capital Deployment</h4>
            <p>
              Where should the Treasury & WASREB allocate emergency intervention funds to prevent human crisis and ensure equity for vulnerable communities?
            </p>
          </div>

          <div className="scqa-card answer">
            <span className="step-badge">4. Answer</span>
            <h4>Targeted Intervention Model</h4>
            <p>
              Prioritize top 12 Critical counties using <strong>Emergency Solar Boreholes</strong> & <strong>Utility Debt Relief</strong>, scaling resilience across high-vulnerability regions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
