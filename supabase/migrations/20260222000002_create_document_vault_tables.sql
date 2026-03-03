-- Migration to create documents and licenses tables

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    guest_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Hosts can manage their own documents"
ON public.documents FOR ALL
TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Admins can manage all documents"
ON public.documents FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- Policies for licenses
CREATE POLICY "Hosts can view licenses for their properties"
ON public.licenses FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = licenses.property_id
        AND p.host_id = auth.uid()
    )
);

CREATE POLICY "Hosts can insert licenses for their properties"
ON public.licenses FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = licenses.property_id
        AND p.host_id = auth.uid()
    )
);

CREATE POLICY "Hosts can update licenses for their properties"
ON public.licenses FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = licenses.property_id
        AND p.host_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = licenses.property_id
        AND p.host_id = auth.uid()
    )
);

CREATE POLICY "Hosts can delete licenses for their properties"
ON public.licenses FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = licenses.property_id
        AND p.host_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all licenses"
ON public.licenses FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);
