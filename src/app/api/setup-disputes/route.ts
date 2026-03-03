import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        console.log('Starting automated setup for disputes table...');

        // 1. Create table and exec_sql helper
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
            sql_string: `
                -- Create exec_sql if it doesn't exist
                CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
                RETURNS void LANGUAGE plpgsql SECURITY DEFINER
                AS $$ BEGIN EXECUTE sql_string; END; $$;
                
                GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;

                ALTER TABLE IF EXISTS public.disputes ADD COLUMN IF NOT EXISTS host_response text;
                NOTIFY pgrst, 'reload schema';

                CREATE TABLE IF NOT EXISTS public.disputes (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    "caseNumber" text NOT NULL,
                    "guestName" text NOT NULL,
                    "hostName" text NOT NULL,
                    "propertyName" text NOT NULL,
                    "issueType" text NOT NULL,
                    priority text NOT NULL,
                    status text NOT NULL DEFAULT 'open',
                    "createdDate" timestamp with time zone DEFAULT now(),
                    "lastUpdate" timestamp with time zone DEFAULT now(),
                    booking_id uuid REFERENCES public.bookings(id),
                    guest_id uuid REFERENCES public.users(id),
                    host_id uuid REFERENCES public.users(id),
                    property_id uuid REFERENCES public.properties(id),
                    description text,
                    host_response text,
                    CONSTRAINT disputes_pkey PRIMARY KEY (id)
                );
                
                ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
                
                DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
                CREATE POLICY "Users can view their own disputes"
                ON public.disputes FOR SELECT
                USING (
                    auth.uid() = guest_id OR 
                    auth.uid() = host_id OR
                    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
                );

                DROP POLICY IF EXISTS "Guests and Hosts can create disputes" ON public.disputes;
                CREATE POLICY "Guests and Hosts can create disputes"
                ON public.disputes FOR INSERT
                WITH CHECK (
                    auth.uid() = guest_id OR 
                    auth.uid() = host_id
                );

                DROP POLICY IF EXISTS "Hosts can update their disputes" ON public.disputes;
                CREATE POLICY "Hosts can update their disputes"
                ON public.disputes FOR UPDATE
                USING (
                    auth.uid() = host_id OR
                    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
                );

                GRANT ALL ON TABLE public.disputes TO anon, authenticated, service_role;
            `
        });

        if (createError) {
            console.error('Setup Error (SQL Exec):', createError);

            // If exec_sql doesn't exist, we might have to explain how to add it, 
            // but let's try a fallback: maybe they have another way?
            // Actually, let's just create it via migration script and ask them to run it again.
            return NextResponse.json({
                success: false,
                message: 'Failed to execute SQL via RPC. Please use the SQL Editor in Supabase Dashboard.',
                error: createError.message
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Disputes table setup complete!' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
