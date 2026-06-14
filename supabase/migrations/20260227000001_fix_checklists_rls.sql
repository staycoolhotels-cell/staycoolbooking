-- Fix RLS policies for cleaning_checklists and cleaning_checklist_items to allow INSERT

-- For cleaning_checklists
DROP POLICY IF EXISTS "Hosts can manage cleaning checklists for their properties" ON public.cleaning_checklists;
CREATE POLICY "Hosts can manage cleaning checklists for their properties"
ON public.cleaning_checklists FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = cleaning_checklists.property_id
        AND p.host_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = cleaning_checklists.property_id
        AND p.host_id = auth.uid()
    )
);
-- For cleaning_checklist_items
DROP POLICY IF EXISTS "Hosts can manage cleaning checklist items for their properties" ON public.cleaning_checklist_items;
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
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cleaning_checklists cc
        JOIN public.properties p ON cc.property_id = p.id
        WHERE cc.id = cleaning_checklist_items.checklist_id
        AND p.host_id = auth.uid()
    )
);
