const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local if present
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.log("Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Reading local counties dataset...");
  const jsonPath = path.join(__dirname, "../data/counties.json");
  const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const records = rawData.map((r) => ({
    county: r.county,
    urgency_score: r.urgencyScore,
    urgency_tier: r.urgencyTier,
    citizens_disrupted_2026: r.citizensDisrupted2026,
    citizens_critical_wvi_2026: r.citizensCriticalWvi2026,
    mean_pred_risk: r.meanPredRisk,
    wgs: r.wgs,
    wgs_tier: r.wgsTier,
    primary_intervention: r.primaryIntervention,
    equity_flag: r.equityFlag,
    pop_2026_est: r.pop2026Est,
  }));

  console.log(`🚀 Upserting ${records.length} county records into Supabase table 'counties'...`);

  const { data, error } = await supabase
    .from("counties")
    .upsert(records, { onConflict: "county" });

  if (error) {
    console.error("❌ Error seeding Supabase:", error.message);
    process.exit(1);
  }

  console.log("✅ Successfully seeded Supabase 'counties' table!");
}

seed();
