import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/supabaseClient";
import countiesJson from "../../../data/counties.json";

export async function GET() {
  // If Supabase credentials are path configured, attempt real-time query
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("counties")
        .select("*")
        .order("urgency_score", { ascending: false });

      if (!error && data && data.length > 0) {
        // Map database snake_case columns back to camelCase for UI compatibility
        const formattedData = data.map((r) => ({
          county: r.county,
          urgencyScore: r.urgency_score,
          urgencyTier: r.urgency_tier,
          citizensDisrupted2026: Number(r.citizens_disrupted_2026),
          citizensCriticalWvi2026: Number(r.citizens_critical_wvi_2026),
          meanPredRisk: r.mean_pred_risk,
          wgs: r.wgs,
          wgsTier: r.wgs_tier,
          primaryIntervention: r.primary_intervention,
          equityFlag: r.equity_flag,
          pop2026Est: Number(r.pop_2026_est),
        }));

        return NextResponse.json({
          data: formattedData,
          source: "supabase",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("Supabase query failed, falling back to local JSON cache:", err.message);
    }
  }

  // Fallback to local JSON dataset cache
  return NextResponse.json({
    data: countiesJson,
    source: "local",
    timestamp: new Date().toISOString(),
  });
}
