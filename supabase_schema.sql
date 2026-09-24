-- ====================================================================
-- WATER FUTURES — SUPABASE POSTGRESQL SCHEMA SETUP
-- Run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Create the counties table
CREATE TABLE IF NOT EXISTS public.counties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    county TEXT UNIQUE NOT NULL,
    urgency_score DOUBLE PRECISION NOT NULL,
    urgency_tier TEXT NOT NULL CHECK (urgency_tier IN ('Critical', 'High', 'Moderate', 'Low')),
    citizens_disrupted_2026 BIGINT NOT NULL,
    citizens_critical_wvi_2026 BIGINT NOT NULL,
    mean_pred_risk DOUBLE PRECISION NOT NULL,
    wgs DOUBLE PRECISION NOT NULL,
    wgs_tier TEXT NOT NULL,
    primary_intervention TEXT NOT NULL,
    equity_flag BOOLEAN DEFAULT FALSE,
    pop_2026_est BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for fast searching & sorting
CREATE INDEX IF NOT EXISTS idx_counties_urgency ON public.counties (urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_counties_tier ON public.counties (urgency_tier);
CREATE INDEX IF NOT EXISTS idx_counties_equity ON public.counties (equity_flag);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy for Public Read Access
CREATE POLICY "Allow public read access to counties"
    ON public.counties
    FOR SELECT
    USING (true);

-- 5. Create Policy for Authenticated Service Role Writes
CREATE POLICY "Allow service role insert/update to counties"
    ON public.counties
    FOR ALL
    USING (true);

-- 6. Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_counties_modtime
    BEFORE UPDATE ON public.counties
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
