"use client";

import { useMemo, useState } from "react";
import { useCountiesData } from "../../lib/useCountiesData";
import { TrendingUp, Database, Code } from "lucide-react";

export default function AnalystPage() {
  const { data, dataSource, loading } = useCountiesData();
  const [selectedCounty, setSelectedCounty] = useState(null);

  // Quadrant Data Breakdown (WGS vs Urgency)
  const quadrantData = useMemo(() => {
    const q1 = []; // High Urgency (>= 0.4), Low Governance (WGS < 0.6)
    const q2 = []; // High Urgency (>= 0.4), High Governance (WGS >= 0.6)
    const q3 = []; // Low Urgency (< 0.4), Low Governance (WGS < 0.6)
    const q4 = []; // Low Urgency (< 0.4), High Governance (WGS >= 0.6)

    data.forEach((r) => {
      const isHighUrgency = r.urgencyScore >= 0.45;
      const isHighGov = r.wgs >= 0.6;

      if (isHighUrgency && !isHighGov) q1.push(r);
      else if (isHighUrgency && isHighGov) q2.push(r);
      else if (!isHighUrgency && !isHighGov) q3.push(r);
      else q4.push(r);
    });

    return { q1, q2, q3, q4 };
  }, [data]);

  return (
    <main className="wrap">
      <header className="app-header">
        <div>
          <h1 className="hero-title">Technical Analyst</h1>
          <p className="hero-subtitle">
            Governance vs. Urgency risk matrix and data source telemetry.
          </p>
        </div>
      </header>

      {/* TECHNICAL ANALYST VIEW: QUADRANT MATRIX */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={20} style={{ color: "var(--cyan-glow)" }} /> Governance (WGS) vs. Urgency Risk Quadrant Matrix
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Plotting Water Governance Score (WGS) against Machine Learning Predicted Disruption Urgency.
          </p>
        </div>

        <div className="quadrant-grid">
          {/* Q1 */}
          <div className="quadrant-box q1">
            <div>
              <h5>
                <span>Q1: Direct State Intervention</span>
                <span className="tier-pill critical" style={{ fontSize: "0.7rem" }}>{quadrantData.q1.length} Counties</span>
              </h5>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                High Urgency + Low Governance (Require emergency national taskforce & solar wells)
              </p>
            </div>
            <div className="county-tags">
              {quadrantData.q1.map((c) => (
                <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)} style={{ cursor: "pointer" }}>
                  {c.county}
                </span>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div className="quadrant-box q2">
            <div>
              <h5>
                <span>Q2: Priority Capital Injection</span>
                <span className="tier-pill high" style={{ fontSize: "0.7rem" }}>{quadrantData.q2.length} Counties</span>
              </h5>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                High Urgency + High Governance (Ready for direct utility financing & pipe expansion)
              </p>
            </div>
            <div className="county-tags">
              {quadrantData.q2.map((c) => (
                <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)} style={{ cursor: "pointer" }}>
                  {c.county}
                </span>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div className="quadrant-box q3">
            <div>
              <h5>
                <span>Q3: Governance Capacity Building</span>
                <span className="tier-pill moderate" style={{ fontSize: "0.7rem" }}>{quadrantData.q3.length} Counties</span>
              </h5>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Low Urgency + Low Governance (Focus on WSP institutional strengthening)
              </p>
            </div>
            <div className="county-tags">
              {quadrantData.q3.map((c) => (
                <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)} style={{ cursor: "pointer" }}>
                  {c.county}
                </span>
              ))}
            </div>
          </div>

          {/* Q4 */}
          <div className="quadrant-box q4">
            <div>
              <h5>
                <span>Q4: Routine Infrastructure Maintenance</span>
                <span className="tier-pill low" style={{ fontSize: "0.7rem" }}>{quadrantData.q4.length} Counties</span>
              </h5>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Low Urgency + High Governance (Stable performance, standard asset lifecycle)
              </p>
            </div>
            <div className="county-tags">
              {quadrantData.q4.map((c) => (
                <span key={c.county} className="county-tag" onClick={() => setSelectedCounty(c)} style={{ cursor: "pointer" }}>
                  {c.county}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DATA SOURCE TELEMETRY */}
      <section className="glass-panel" style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Database size={18} style={{ color: "var(--cyan-glow)" }} /> Telemetry & Schema
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
          Current Pipeline Status: <strong>{loading ? "Loading..." : dataSource === "supabase" ? "Connected to Supabase PostgreSQL" : "Local JSON Dataset Loaded"}</strong>
        </p>

        <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-glass)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <div style={{ color: "var(--cyan-glow)", marginBottom: "0.5rem" }}>$ SELECT * FROM public.counties LIMIT 1;</div>
          {loading ? "..." : JSON.stringify(data[0] || {}, null, 2)}
        </div>
      </section>

      {/* COUNTY DETAIL MODAL */}
      {selectedCounty && (
        <div className="modal-overlay" onClick={() => setSelectedCounty(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className={`tier-pill ${selectedCounty.urgencyTier.toLowerCase()}`} style={{ marginBottom: "0.5rem" }}>
                  {selectedCounty.urgencyTier} Urgency Tier
                </span>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>{selectedCounty.county} County</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedCounty(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Urgency Index</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--cyan-glow)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedCounty.urgencyScore.toFixed(3)}
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Governance Index (WGS)</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedCounty.wgs.toFixed(2)} <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>({selectedCounty.wgsTier})</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCounty(null)}
              style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
