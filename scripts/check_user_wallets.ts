import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    let result = '';

    // Check RLS policies via pg_policies view
    const { data: policies, error: pErr } = await supabaseAdmin
        .rpc('execute_sql', { sql: "SELECT * FROM pg_policies WHERE tablename = 'user_wallets'" });

    result += 'Policies execution error: ' + JSON.stringify(pErr) + '\n';
    result += 'Policies data: ' + JSON.stringify(policies) + '\n';

    // Try without RPC if RPC fails
    if (pErr) {
        // Unfortunately standard JS client doesn't have an easy way to query pg_policies without a Postgres connection
        // But what we CAN do is attempt to create the appropriate policies and log if they fail.
        result += 'Creating RLS policies sql string to execute manually if needed.\n';
    }

    // Since we are likely missing RLS or the user doesn't have proper permissions, let's just write an SQL script to fix it.

    fs.writeFileSync('wallets_test_output.txt', result);
}

check();
