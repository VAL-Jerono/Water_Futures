"use client";

import { useEffect, useMemo, useState } from "react";

const TIER_ORDER = ["Critical", "High", "Moderate", "Low"];
const TIER_COLORS = {
  Critical: "#c0392b",
  High: "#e67e22",
  Moderate: "#f1c40f",
  Low: "#27ae60",
};

export default function Home() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [equityOnly, setEquityOnly] = useState(false);

  useEffect(() => {
    fetch("/api/counties")
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (tierFilter === "All" ? true : r.urgencyTier === tierFilter))
      .filter((r) => (equityOnly ? r.equityFlag : true))
      .filter((r) => r.county.toLowerCase().includes(search.toLowerCase()));
  }, [rows, tierFilter, search, equityOnly]);

  const maxScore = rows.length ? Math.max(...rows.map((r) => r.urgencyScore)) : 1;

  return (
    <main className="wrap">
      <header>
        <h1>Water Futures — County Intervention Priority</h1>
        <p className="sub">
          Population-weighted disruption risk across Kenya&apos;s 47 counties. Screening
          tool for prioritisation discussions — not a substitute for on-the-ground
          engineering assessment.
        </p>
      </header>

      <section className="controls">
        <input
          type="text"
          placeholder="Search county…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="All">All tiers</option>
          {TIER_ORDER.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={equityOnly}
            onChange={(e) => setEquityOnly(e.target.checked)}
          />
          Equity-flagged only
        </label>
      </section>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>County</th>
              <th>Urgency</th>
              <th>Tier</th>
              <th>Citizens affected (2026 est.)</th>
              <th>ML risk</th>
              <th>Governance (WGS)</th>
              <th>Recommended action</th>
              <th>Equity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.county}>
                <td className="county">{r.county}</td>
                <td>
                  <div className="bar-cell">
                    <div
                      className="bar"
                      style={{
                        width: `${(r.urgencyScore / maxScore) * 100}%`,
                        background: TIER_COLORS[r.urgencyTier] || "#999",
                      }}
                    />
                    <span>{r.urgencyScore.toFixed(3)}</span>
                  </div>
                </td>
                <td>
                  <span className="tier" style={{ background: TIER_COLORS[r.urgencyTier] }}>
                    {r.urgencyTier}
                  </span>
                </td>
                <td>{r.citizensDisrupted2026.toLocaleString()}</td>
                <td>{(r.meanPredRisk * 100).toFixed(1)}%</td>
                <td>
                  {r.wgs.toFixed(2)} ({r.wgsTier})
                </td>
                <td>{r.primaryIntervention}</td>
                <td>{r.equityFlag ? "♀" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer>
        <p>
          Source: KHS 2023/24 + KPHC 2019 population projections. Urgency score blends
          model-predicted disruption risk, household vulnerability index, governance
          score, and population exposure. Figures are estimates for prioritisation —
          treat as a starting point for further verification, not a final allocation
          decision.
        </p>
      </footer>
    </main>
  );
}
