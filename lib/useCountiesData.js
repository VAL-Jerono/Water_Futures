"use client";
import { useState, useEffect, useMemo } from "react";

export function useCountiesData() {
  const [data, setData] = useState([]);
  const [dataSource, setDataSource] = useState("loading");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/counties")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.data) {
          setData(resData.data);
          setDataSource(resData.source || "local");
        } else {
          setData(resData);
          setDataSource("local");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch counties:", err);
        setLoading(false);
      });
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!data.length) return { totalDisrupted: 0, criticalCount: 0, highCount: 0, totalPop: 0, equityCount: 0 };
    const totalDisrupted = data.reduce((acc, r) => acc + (r.citizensDisrupted2026 || 0), 0);
    const criticalCount = data.filter((r) => r.urgencyTier === "Critical").length;
    const highCount = data.filter((r) => r.urgencyTier === "High").length;
    const equityCount = data.filter((r) => r.equityFlag).length;
    const totalPop = data.reduce((acc, r) => acc + (r.pop2026Est || 0), 0);

    return { totalDisrupted, criticalCount, highCount, totalPop, equityCount };
  }, [data]);

  return { data, dataSource, loading, summaryMetrics };
}
