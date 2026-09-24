"use client";

import { useCountiesData } from "../lib/useCountiesData";
import Link from "next/link";

export default function ExecutivePage() {
  const { data, loading, summaryMetrics } = useCountiesData();

  return (
    <main className="wrap">
      {/* PAGE HEADER */}
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Kenya · Water Infrastructure · 2026 Outlook
        </div>
        <h1 className="page-title">{loading ? "..." : (summaryMetrics.totalDisrupted / 1000000).toFixed(2)} Million Kenyans Will Lose Water by 2026.</h1>
        <p className="page-subtitle">
          We know which counties, which communities, and exactly what needs to happen. Here is the case for immediate action.
        </p>
      </header>

      {/* ── KEY FINDING BANNER ── */}
      <section className="story-banner">
        <div className="story-takeaway">
          <div className="story-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div className="story-takeaway-text">
            <h3>Key Finding</h3>
            <p>
              Targeting just <strong>{loading ? "..." : summaryMetrics.totalRiskCounties} out of 47 counties</strong> with <em>Emergency Solar Boreholes and Utility Debt Relief</em> will protect <strong>{loading ? "..." : summaryMetrics.highRiskPct}% of the at-risk population</strong> - the highest-return intervention Kenya's water sector can make right now.
            </p>
          </div>
        </div>
        <Link href="/manager" className="story-cta">
          See the {loading ? "..." : summaryMetrics.totalRiskCounties} Counties
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </section>

      {/* ── HEADLINE METRICS ── */}
      <section className="stat-grid">
        <div className="glass-panel stat-card">
          <div className="stat-card-accent critical"></div>
          <div className="stat-icon critical">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-label">Citizens Facing Disruption</div>
          <div className="stat-value">{loading ? "-" : summaryMetrics.totalDisrupted.toLocaleString()}</div>
          <div className="stat-sub">Projected water-disrupted population, 2026</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-accent high"></div>
          <div className="stat-icon high">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-label">Counties in Critical State</div>
          <div className="stat-value">{loading ? "-" : summaryMetrics.criticalCount}</div>
          <div className="stat-sub">No margin for delay - intervention is overdue</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-accent cyan"></div>
          <div className="stat-icon cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="stat-label">Average Governance Readiness</div>
          <div className="stat-value">{loading ? "—" : summaryMetrics.avgWgs.toFixed(2)} / 1.0</div>
          <div className="stat-sub">Many utilities lack capacity to self-recover without support</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-accent moderate"></div>
          <div className="stat-icon emerald">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="stat-label">Equity-Priority Counties</div>
          <div className="stat-value">{loading ? "-" : summaryMetrics.equityCount}</div>
          <div className="stat-sub">Areas with high female household vulnerability - design must be gender-inclusive</div>
        </div>
      </section>

      {/* ── THE STORY IN FOUR PANELS ── */}
      <section>
        <h2 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          The Full Picture - Context, Risk, Decision &amp; Action
        </h2>

        <div className="scqa-container">
          <div className="scqa-card situation">
            <span className="scqa-step-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              The Context
            </span>
            <h4>Kenya's Water System Is Under Stress</h4>
            <p>47 counties. Over <strong>50 million Kenyans</strong> dependent on Water Service Providers regulated by WASREB. Many utilities are under-resourced, debt-burdened, and operating in regions already stressed by climate change.</p>
          </div>

          <div className="scqa-card complication">
            <span className="scqa-step-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              The Threat
            </span>
            <h4>A Crisis Is Already Forming</h4>
            <p>Accelerating droughts, rising utility debt, and weak governance are converging. Our model predicts <strong>{loading ? "..." : (summaryMetrics.totalDisrupted / 1000000).toFixed(2)} million citizens will face measurable water disruption by 2026</strong> without targeted intervention.</p>
          </div>

          <div className="scqa-card question">
            <span className="scqa-step-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              The Decision
            </span>
            <h4>How Do We Maximise Every Shilling Spent?</h4>
            <p>With finite budget, not every county can be reached at once. WASREB and Treasury must choose: spread resources thin across 47 counties, or concentrate on the counties where intervention will save the most lives?</p>
          </div>

          <div className="scqa-card answer">
            <span className="scqa-step-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              The Plan
            </span>
            <h4>Concentrate. Intervene. Protect.</h4>
            <p>Deploy <strong>Emergency Solar Boreholes &amp; Utility Debt Relief</strong> to the {loading ? "..." : summaryMetrics.totalRiskCounties} highest-urgency counties first. This resolves {loading ? "..." : summaryMetrics.highRiskPct}% of national risk, with equity-flagged communities receiving gender-inclusive water access design.</p>
          </div>
        </div>
      </section>

      <footer className="page-footer">
        <span>Source: Kenya Household Survey 2023/24 · KPHC 2019 population projections · WASREB WGS Index</span>
        <span>Water Futures Kenya · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
