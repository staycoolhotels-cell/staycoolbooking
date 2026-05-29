-- Enable realtime for maintenance and cleaning tables safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr 
            JOIN pg_publication p ON p.oid = pr.prpubid 
            JOIN pg_class c ON c.oid = pr.prrelid 
            WHERE p.pubname = 'supabase_realtime' AND c.relname = 'maintenance_alerts'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_alerts;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr 
            JOIN pg_publication p ON p.oid = pr.prpubid 
            JOIN pg_class c ON c.oid = pr.prrelid 
            WHERE p.pubname = 'supabase_realtime' AND c.relname = 'cleaning_checklists'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaning_checklists;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr 
            JOIN pg_publication p ON p.oid = pr.prpubid 
            JOIN pg_class c ON c.oid = pr.prrelid 
            WHERE p.pubname = 'supabase_realtime' AND c.relname = 'cleaning_checklist_items'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaning_checklist_items;
        END IF;
    END IF;
END $$;
