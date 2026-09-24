"use client";

import { useState, useMemo } from "react";
import { useCountiesData } from "../../lib/useCountiesData";
import { Sliders, Search, ShieldAlert, Sparkles, Database } from "lucide-react";

const TIER_ORDER = ["Critical", "High", "Moderate", "Low"];

export default function ManagerPage() {
  const { data, loading, summaryMetrics } = useCountiesData();

  const [simulatedBudget, setSimulatedBudget] = useState(3000);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [equityOnly, setEquityOnly] = useState(false);
  const [sortField, setSortField] = useState("urgencyScore");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedCounty, setSelectedCounty] = useState(null);

  // Filtered & Sorted Counties Table
  const filteredData = useMemo(() => {
    return data
      .filter((r) => (tierFilter === "All" ? true : r.urgencyTier === tierFilter))
      .filter((r) => (equityOnly ? r.equityFlag : true))
      .filter((r) => r.county.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [data, tierFilter, equityOnly, search, sortField, sortDirection]);

  // Simulation Results
  const simulationResults = useMemo(() => {
    const countCovered = Math.min(data.length, Math.floor(simulatedBudget / 250));
    const sortedByRisk = [...data].sort((a, b) => b.urgencyScore - a.urgencyScore);
    const coveredCounties = sortedByRisk.slice(0, countCovered);
    const peopleProtected = coveredCounties.reduce((acc, c) => acc + c.citizensDisrupted2026, 0);
    const pctProtected = summaryMetrics.totalDisrupted
      ? ((peopleProtected / summaryMetrics.totalDisrupted) * 100).toFixed(1)
      : 0;

    return { countCovered, peopleProtected, pctProtected };
  }, [simulatedBudget, data, summaryMetrics.totalDisrupted]);

  const maxUrgency = data.length ? Math.max(...data.map((r) => r.urgencyScore)) : 1;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <main className="wrap">
      <header className="app-header">
        <div>
          <h1 className="hero-title">Operations Manager</h1>
          <p className="hero-subtitle">
            Actionable intervention table and budget simulation tool.
          </p>
        </div>
      </header>

      {/* ACTION SIMULATOR SECTION ("END WITH ACTION") */}
      <section className="glass-panel" style={{ marginBottom: "2.5rem", background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.7))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sliders size={20} style={{ color: "var(--cyan-glow)" }} /> Decision Support — Emergency Budget Allocation Simulator
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              Simulate allocating intervention capital across high-risk counties to measure human protection impact.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--cyan-glow)", fontFamily: "'JetBrains Mono', monospace" }}>
              Budget: KSh {simulatedBudget.toLocaleString()} Million
            </span>
          </div>
        </div>

        <input
          type="range"
          min="500"
          max="10000"
          step="250"
          value={simulatedBudget}
          onChange={(e) => setSimulatedBudget(Number(e.target.value))}
          style={{ width: "100%", marginBottom: "1.5rem", accentColor: "var(--cyan-glow)", cursor: "pointer" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Counties Covered</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
              {simulationResults.countCovered} / 47
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Citizens Protected</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--low-green)", fontFamily: "'JetBrains Mono', monospace" }}>
              {simulationResults.peopleProtected.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>National Risk Mitigated</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cyan-glow)", fontFamily: "'JetBrains Mono', monospace" }}>
              {simulationResults.pctProtected}%
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & CONTROL BAR */}
      <section className="controls-bar">
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: "2.8rem" }}
            placeholder="Search by county name (e.g. Turkana, Kilifi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select-dropdown" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="All">All Urgency Tiers ({data.length})</option>
          {TIER_ORDER.map((t) => (
            <option key={t} value={t}>
              {t} Tier ({data.filter((r) => r.urgencyTier === t).length})
            </option>
          ))}
        </select>

        <label className="checkbox-label">
          <input type="checkbox" checked={equityOnly} onChange={(e) => setEquityOnly(e.target.checked)} />
          Equity-Flagged Priority Only
        </label>
      </section>

      {/* DATA TABLE */}
      <section className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("county")} style={{ cursor: "pointer" }}>
                County {sortField === "county" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("urgencyScore")} style={{ cursor: "pointer" }}>
                Urgency Score {sortField === "urgencyScore" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("urgencyTier")} style={{ cursor: "pointer" }}>
                Tier {sortField === "urgencyTier" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("citizensDisrupted2026")} style={{ cursor: "pointer" }}>
                Citizens Affected (2026) {sortField === "citizensDisrupted2026" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("meanPredRisk")} style={{ cursor: "pointer" }}>
                ML Disruption Risk {sortField === "meanPredRisk" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("wgs")} style={{ cursor: "pointer" }}>
                Governance (WGS) {sortField === "wgs" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Recommended Action</th>
              <th>Equity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                  Loading county dataset...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                  No county matching search criteria.
                </td>
              </tr>
            ) : (
              filteredData.map((r) => {
                const tierClass = r.urgencyTier.toLowerCase();
                const barColor =
                  tierClass === "critical"
                    ? "var(--critical-red)"
                    : tierClass === "high"
                    ? "var(--high-orange)"
                    : tierClass === "moderate"
                    ? "var(--moderate-yellow)"
                    : "var(--low-green)";

                return (
                  <tr key={r.county} onClick={() => setSelectedCounty(r)}>
                    <td className="county-name">{r.county}</td>
                    <td>
                      <div className="bar-cell">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${(r.urgencyScore / maxUrgency) * 100}%`, background: barColor }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.85rem" }}>
                          {r.urgencyScore.toFixed(3)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`tier-pill ${tierClass}`}>{r.urgencyTier}</span>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {r.citizensDisrupted2026.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {(r.meanPredRisk * 100).toFixed(1)}%
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.wgs.toFixed(2)}</span>{" "}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>({r.wgsTier})</span>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{r.primaryIntervention}</td>
                    <td>{r.equityFlag ? <span style={{ color: "var(--critical-red)", fontWeight: 800 }}>♀ YES</span> : <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Disrupted Citizens (2026)</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedCounty.citizensDisrupted2026.toLocaleString()}
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Governance Index (WGS)</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedCounty.wgs.toFixed(2)} <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>({selectedCounty.wgsTier})</span>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>ML Disruption Probability</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
                  {(selectedCounty.meanPredRisk * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.95rem", color: "var(--cyan-glow)", fontWeight: 700, marginBottom: "0.35rem" }}>
                Primary Action Recommendation
              </h4>
              <p style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 600 }}>{selectedCounty.primaryIntervention}</p>
              {selectedCounty.equityFlag && (
                <p style={{ fontSize: "0.82rem", color: "var(--critical-red)", marginTop: "0.5rem", fontWeight: 700 }}>
                  ♀ Equity Flagged: High female household vulnerability requiring gender-inclusive water access design.
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedCounty(null)}
              style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Close County Details
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
