-- Enable realtime for maintenance and cleaning tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_alerts;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaning_checklists;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaning_checklist_items;
    END IF;
END $$;
