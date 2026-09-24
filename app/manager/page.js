"use client";

import { useState, useMemo } from "react";
import { useCountiesData } from "../../lib/useCountiesData";

const TIER_ORDER = ["Critical", "High", "Moderate", "Low"];

export default function ManagerPage() {
  const { data, loading, summaryMetrics } = useCountiesData();

  const [simulatedBudget, setSimulatedBudget] = useState(3000);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [equityOnly, setEquityOnly] = useState(false);
  const [sortField, setSortField] = useState("urgencyScore");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedCounty, setSelectedCounty] = useState(null);

  const filteredData = useMemo(() => {
    return data
      .filter((r) => (tierFilter === "All" ? true : r.urgencyTier === tierFilter))
      .filter((r) => (equityOnly ? r.equityFlag : true))
      .filter((r) => r.county.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let va = a[sortField], vb = b[sortField];
        if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
      });
  }, [data, tierFilter, equityOnly, search, sortField, sortDir]);

  const simulationResults = useMemo(() => {
    const countCovered = Math.min(data.length, Math.floor(simulatedBudget / 250));
    const sorted = [...data].sort((a, b) => b.urgencyScore - a.urgencyScore);
    const covered = sorted.slice(0, countCovered);
    const peopleProtected = covered.reduce((acc, c) => acc + c.citizensDisrupted2026, 0);
    const pct = summaryMetrics.totalDisrupted
      ? ((peopleProtected / summaryMetrics.totalDisrupted) * 100).toFixed(1)
      : 0;
    return { countCovered, peopleProtected, pct };
  }, [simulatedBudget, data, summaryMetrics.totalDisrupted]);

  const maxUrgency = data.length ? Math.max(...data.map((r) => r.urgencyScore)) : 1;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const barColor = (tier) => ({
    critical: "var(--critical)", high: "var(--high)", moderate: "var(--moderate)", low: "var(--low)"
  }[tier.toLowerCase()] || "var(--text-muted)");

  return (
    <main className="wrap">
      {/* PAGE HEADER */}
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          Kenya · County Intervention Priorities · 2026
        </div>
        <h1 className="page-title">Prioritise, Fund, Protect.</h1>
        <p className="page-subtitle">
          Every county ranked by disruption risk. Drag the budget slider to see how many people a given level of investment actually protects - then decide where to deploy.
        </p>
      </header>

      {/* ── BUDGET SIMULATOR ── */}
      <section className="simulator-card">
        <div className="simulator-header">
          <div>
            <div className="simulator-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              If we invest KSh {simulatedBudget.toLocaleString()}M - who does it reach?
            </div>
            <div className="simulator-subtitle">KSh 250M deployed per county. Slide left or right to explore the human impact of different funding levels.</div>
          </div>
          <div className="simulator-budget-display">KSh {simulatedBudget.toLocaleString()}M</div>
        </div>

        <input
          type="range" min="500" max="10000" step="250"
          value={simulatedBudget}
          onChange={(e) => setSimulatedBudget(Number(e.target.value))}
        />

        <div className="simulator-results">
          <div className="simulator-result-item">
            <div className="sim-label">Counties Covered</div>
            <div className="sim-value neutral">{simulationResults.countCovered} <span style={{fontSize:"1rem", color:"var(--text-muted)"}}>/ 47</span></div>
          </div>
          <div className="simulator-result-item">
            <div className="sim-label">Citizens Protected</div>
            <div className="sim-value success">{simulationResults.peopleProtected.toLocaleString()}</div>
          </div>
          <div className="simulator-result-item">
            <div className="sim-label">National Risk Mitigated</div>
            <div className="sim-value info">{simulationResults.pct}%</div>
          </div>
        </div>
      </section>

      {/* ── CONTROLS ── */}
      <div className="controls-bar">
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search county name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select-dropdown" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="All">All Tiers ({data.length})</option>
          {TIER_ORDER.map((t) => (
            <option key={t} value={t}>{t} ({data.filter((r) => r.urgencyTier === t).length})</option>
          ))}
        </select>

        <label className="checkbox-label">
          <input type="checkbox" checked={equityOnly} onChange={(e) => setEquityOnly(e.target.checked)} />
          High-vulnerability communities only
        </label>
      </div>

      {/* ── PRIORITY TABLE ── */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("county")}>County{sortIcon("county")}</th>
              <th className="sortable" onClick={() => handleSort("urgencyScore")}>Urgency Score{sortIcon("urgencyScore")}</th>
              <th className="sortable" onClick={() => handleSort("urgencyTier")}>Tier{sortIcon("urgencyTier")}</th>
              <th className="sortable" onClick={() => handleSort("citizensDisrupted2026")}>Citizens Affected{sortIcon("citizensDisrupted2026")}</th>
              <th className="sortable" onClick={() => handleSort("meanPredRisk")}>ML Risk{sortIcon("meanPredRisk")}</th>
              <th className="sortable" onClick={() => handleSort("wgs")}>WGS{sortIcon("wgs")}</th>
              <th>Action</th>
              <th>Equity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading dataset…</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>No counties match your filters.</td></tr>
            ) : (
              filteredData.map((r) => (
                <tr key={r.county} onClick={() => setSelectedCounty(r)}>
                  <td className="county-name">{r.county}</td>
                  <td>
                    <div className="bar-cell">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${(r.urgencyScore / maxUrgency) * 100}%`, background: barColor(r.urgencyTier) }} />
                      </div>
                      <span className="score-value">{r.urgencyScore.toFixed(3)}</span>
                    </div>
                  </td>
                  <td><span className={`tier-pill ${r.urgencyTier.toLowerCase()}`}>{r.urgencyTier}</span></td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{r.citizensDisrupted2026.toLocaleString()}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{(r.meanPredRisk * 100).toFixed(1)}%</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.wgs.toFixed(2)}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>({r.wgsTier})</span>
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: "180px" }}>{r.primaryIntervention}</td>
                  <td>
                    {r.equityFlag
                      ? <span style={{ color: "var(--critical)", fontWeight: 800, fontSize: "0.8rem" }}>♀ YES</span>
                      : <span style={{ color: "var(--text-muted)" }}>-</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                <div className="modal-stat-label">Citizens Affected (2026)</div>
                <div className="modal-stat-value">{selectedCounty.citizensDisrupted2026.toLocaleString()}</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-label">Governance Index (WGS)</div>
                <div className="modal-stat-value">{selectedCounty.wgs.toFixed(2)} <span style={{fontSize:"0.8rem",color:"var(--text-muted)"}}>({selectedCounty.wgsTier})</span></div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-label">ML Disruption Probability</div>
                <div className="modal-stat-value">{(selectedCounty.meanPredRisk * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="modal-action-box">
              <div className="modal-action-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Recommended Action
              </div>
              <div className="modal-action-text">{selectedCounty.primaryIntervention}</div>
              {selectedCounty.equityFlag && (
                <div className="modal-equity-flag">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Equity Flagged - Gender-inclusive water access design required.
                </div>
              )}
            </div>

            <button className="modal-btn-close" onClick={() => setSelectedCounty(null)}>Close County Details</button>
          </div>
        </div>
      )}

      <footer className="page-footer">
        <span>Source: KHS 2023/24 · KPHC 2019 projections · WASREB WGS Index</span>
        <span>{filteredData.length} counties shown</span>
      </footer>
    </main>
  );
}
