-- Add missing INSERT policy for admins to cleaning_checklists and cleaning_checklist_items

-- For cleaning_checklists
DROP POLICY IF EXISTS "Admins can manage all cleaning checklists" ON public.cleaning_checklists;
CREATE POLICY "Admins can manage all cleaning checklists"
ON public.cleaning_checklists FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- For cleaning_checklist_items
DROP POLICY IF EXISTS "Admins can manage all cleaning checklist items" ON public.cleaning_checklist_items;
CREATE POLICY "Admins can manage all cleaning checklist items"
ON public.cleaning_checklist_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);
