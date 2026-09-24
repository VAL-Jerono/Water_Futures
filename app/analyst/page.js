"use client";

import { useMemo, useState } from "react";
import { useCountiesData } from "../../lib/useCountiesData";

export default function AnalystPage() {
  const { data, dataSource, loading } = useCountiesData();
  const [selectedCounty, setSelectedCounty] = useState(null);

  const quadrantData = useMemo(() => {
    const q1 = [], q2 = [], q3 = [], q4 = [];
    data.forEach((r) => {
      const hi = r.urgencyScore >= 0.36;
      const hg = r.wgs >= 0.42;
      if (hi && !hg) q1.push(r);
      else if (hi && hg) q2.push(r);
      else if (!hi && !hg) q3.push(r);
      else q4.push(r);
    });
    return { q1, q2, q3, q4 };
  }, [data]);

  return (
    <main className="wrap">
      {/* PAGE HEADER */}
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="11" cy="19" r="2"/><circle cx="17" cy="14" r="2"/><path d="M7.5 7.5 17 14M18 5 17 14M11 19 17 14"/></svg>
          Kenya · County Risk vs. Governance · 2026 Model
        </div>
        <h1 className="page-title">Who Needs Help? And Can They Absorb It?</h1>
        <p className="page-subtitle">
          Counties plotted on two axes: how severe is their predicted water disruption, and how capable is their utility of implementing an intervention? Four clusters, four distinct strategies.
        </p>
      </header>

      {/* ── MATRIX SECTION ── */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 className="section-title">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          {data.length} Counties Mapped - Governance Readiness vs. Urgency of Need
        </h2>

        {/* Axis labels */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.5rem" }}>
          <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>
            ← Low Governance · · · · High Governance →
          </span>
        </div>

        <div style={{ display:"flex", gap:"0.5rem", alignItems:"stretch" }}>
          {/* Vertical axis label */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:"22px", flexShrink:0 }}>
            <span style={{ fontSize:"0.72rem", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", writingMode:"vertical-rl", transform:"rotate(180deg)" }}>
              ↑ High Urgency
            </span>
          </div>

          <div className="quadrant-grid" style={{ flex:1 }}>
            {/* Q1 - top-left: high urgency, low gov */}
            <div className="quadrant-box q1">
              <div className="quadrant-header">
                <div>
                  <div className="quadrant-title">Q1 · Direct State Intervention</div>
                  <div className="quadrant-desc">High Urgency + Weak Governance - national emergency taskforce &amp; solar wells required.</div>
                </div>
                <span className="tier-pill critical">{quadrantData.q1.length}</span>
              </div>
              <div className="county-tags">
                {quadrantData.q1.map((c) => (
                  <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)}>{c.county}</span>
                ))}
                {quadrantData.q1.length === 0 && <span style={{color:"var(--text-muted)",fontSize:"0.8rem"}}>No counties in this quadrant</span>}
              </div>
            </div>

            {/* Q2 - top-right: high urgency, high gov */}
            <div className="quadrant-box q2">
              <div className="quadrant-header">
                <div>
                  <div className="quadrant-title">Q2 · Priority Capital Injection</div>
                  <div className="quadrant-desc">High Urgency + Strong Governance - ready for direct utility financing &amp; pipe expansion.</div>
                </div>
                <span className="tier-pill high">{quadrantData.q2.length}</span>
              </div>
              <div className="county-tags">
                {quadrantData.q2.map((c) => (
                  <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)}>{c.county}</span>
                ))}
                {quadrantData.q2.length === 0 && <span style={{color:"var(--text-muted)",fontSize:"0.8rem"}}>No counties in this quadrant</span>}
              </div>
            </div>

            {/* Q3 - bottom-left: low urgency, low gov */}
            <div className="quadrant-box q3">
              <div className="quadrant-header">
                <div>
                  <div className="quadrant-title">Q3 · Governance Capacity Building</div>
                  <div className="quadrant-desc">Low Urgency + Weak Governance - focus on WSP institutional strengthening &amp; training.</div>
                </div>
                <span className="tier-pill moderate">{quadrantData.q3.length}</span>
              </div>
              <div className="county-tags">
                {quadrantData.q3.map((c) => (
                  <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)}>{c.county}</span>
                ))}
                {quadrantData.q3.length === 0 && <span style={{color:"var(--text-muted)",fontSize:"0.8rem"}}>No counties in this quadrant</span>}
              </div>
            </div>

            {/* Q4 - bottom-right: low urgency, high gov */}
            <div className="quadrant-box q4">
              <div className="quadrant-header">
                <div>
                  <div className="quadrant-title">Q4 · Routine Maintenance</div>
                  <div className="quadrant-desc">Low Urgency + Strong Governance - stable performance; standard asset lifecycle management.</div>
                </div>
                <span className="tier-pill low">{quadrantData.q4.length}</span>
              </div>
              <div className="county-tags">
                {quadrantData.q4.map((c) => (
                  <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)}>{c.county}</span>
                ))}
                {quadrantData.q4.length === 0 && <span style={{color:"var(--text-muted)",fontSize:"0.8rem"}}>No counties in this quadrant</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TELEMETRY CARD ── */}
      <div className="telemetry-card">
        <div className="telemetry-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          Live Data Source
        </div>
        <p style={{ fontSize:"0.875rem", color:"var(--text-muted)", marginBottom:"1rem" }}>
          Reading from: <strong style={{color:"#fff"}}>{loading ? "Connecting…" : dataSource === "supabase" ? "Supabase PostgreSQL (live, real-time)" : "Local dataset (counties.json)"}</strong>
          {" "}- {data.length} county records.
        </p>
        <div className="code-block">
          <div className="code-prompt">$ SELECT * FROM public.counties ORDER BY urgency_score DESC LIMIT 1;</div>
          {loading ? "Fetching…" : JSON.stringify(data[0] || {}, null, 2)}
        </div>
      </div>

      {/* ── COUNTY MODAL ── */}
      {selectedCounty && (
        <div className="modal-overlay" onClick={() => setSelectedCounty(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className={`tier-pill ${selectedCounty.urgencyTier.toLowerCase()}`}>{selectedCounty.urgencyTier}</span>
                <div className="modal-county-name">{selectedCounty.county} County</div>
              </div>
              <button className="modal-close" onClick={() => setSelectedCounty(null)}>×</button>
            </div>

            <div className="modal-grid">
              <div className="modal-stat">
                <div className="modal-stat-label">Urgency Index</div>
                <div className="modal-stat-value cyan">{selectedCounty.urgencyScore.toFixed(3)}</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-label">Governance Score (WGS)</div>
                <div className="modal-stat-value">{selectedCounty.wgs.toFixed(2)}</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-label">Citizens at Risk</div>
                <div className="modal-stat-value">{selectedCounty.citizensDisrupted2026.toLocaleString()}</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-label">ML Risk Score</div>
                <div className="modal-stat-value">{(selectedCounty.meanPredRisk * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="modal-action-box">
              <div className="modal-action-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Recommended Action
              </div>
              <div className="modal-action-text">{selectedCounty.primaryIntervention}</div>
            </div>

            <button className="modal-btn-close" onClick={() => setSelectedCounty(null)}>Close</button>
          </div>
        </div>
      )}

      <footer className="page-footer">
        <span>Water Futures Kenya · WGS threshold: 0.42 (avg) · Urgency threshold: 0.36 (High/Critical)</span>
        <span>Source: KHS 2023/24 · WASREB</span>
      </footer>
    </main>
  );
}
