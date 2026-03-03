
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
    try {
        // Attempt to read pg_policies via RPC if available, or just standard query if allowed
        // Standard query on pg_policies is usually not exposed via PostgREST
        // But maybe we can try an RPC call if one exists for diagnostics

        // Actually, let's try to query a known function or just infer.
        // Since we can't query pg_policies directly via SDK...

        console.log("Checking if we can see properties via Service Role (Admin)...");
        const { count, error } = await adminClient.from('properties').select('*', { count: 'exact', head: true });

        if (error) console.log("Admin Error:", error.message);
        else console.log("Admin Count:", count);

    } catch (err) {
        console.log('EXCEPTION:', err.message);
    }
}

checkPolicies();
