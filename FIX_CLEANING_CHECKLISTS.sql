-- FIX_CLEANING_CHECKLISTS.sql
-- 1. Create cleaning_checklists table
CREATE TABLE IF NOT EXISTS public.cleaning_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assigned_to TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cleaning_checklists
ALTER TABLE public.cleaning_checklists ENABLE ROW LEVEL SECURITY;

-- 2. Create cleaning_checklist_items table (for individual items in a checklist)
CREATE TABLE IF NOT EXISTS public.cleaning_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.cleaning_checklists(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cleaning_checklist_items
ALTER TABLE public.cleaning_checklist_items ENABLE ROW LEVEL SECURITY;

-- Policies for cleaning_checklists
CREATE POLICY "Hosts can manage cleaning checklists for their properties"
ON public.cleaning_checklists FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = cleaning_checklists.property_id
        AND p.host_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all cleaning checklists"
ON public.cleaning_checklists FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- Policies for cleaning_checklist_items
CREATE POLICY "Hosts can manage cleaning checklist items for their properties"
ON public.cleaning_checklist_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cleaning_checklists cc
        JOIN public.properties p ON cc.property_id = p.id
        WHERE cc.id = cleaning_checklist_items.checklist_id
        AND p.host_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all cleaning checklist items"
ON public.cleaning_checklist_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
