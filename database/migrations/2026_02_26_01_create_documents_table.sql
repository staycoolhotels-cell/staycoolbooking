-- ============================================================
-- CREATE DOCUMENTS TABLE
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'Other',
  url          TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Hosts can see their own documents
CREATE POLICY "hosts_select_own_documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

-- Hosts can insert their own documents
CREATE POLICY "hosts_insert_own_documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

-- Hosts can delete their own documents
CREATE POLICY "hosts_delete_own_documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());
