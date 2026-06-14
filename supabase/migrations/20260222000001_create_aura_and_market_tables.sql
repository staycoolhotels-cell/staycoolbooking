-- Migration to create the aura_quality_scores and market_comparisons tables

-- 1. Create aura_quality_scores table
CREATE TABLE IF NOT EXISTS public.aura_quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    optimization_tips TEXT[] DEFAULT ARRAY[]::TEXT[],
    ranking_improvement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.aura_quality_scores ENABLE ROW LEVEL SECURITY;
-- 2. Create market_comparisons table
CREATE TABLE IF NOT EXISTS public.market_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    average_local_price NUMERIC NOT NULL,
    suggested_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.market_comparisons ENABLE ROW LEVEL SECURITY;
-- Policies for aura_quality_scores
CREATE POLICY "Hosts can view their property aura scores"
ON public.aura_quality_scores FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = aura_quality_scores.property_id
        AND p.host_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage aura scores"
ON public.aura_quality_scores FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);
-- Policies for market_comparisons
CREATE POLICY "Hosts can view their market comparisons"
ON public.market_comparisons FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = market_comparisons.property_id
        AND p.host_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage market comparisons"
ON public.market_comparisons FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);
