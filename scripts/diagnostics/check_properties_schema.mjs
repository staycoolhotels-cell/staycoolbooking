import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('--- RUNNING MIGRATION VIA exec_sql RPC ---');
    const sql = `
        ALTER TABLE public.properties 
        ADD COLUMN IF NOT EXISTS standard_price INTEGER;

        UPDATE public.properties 
        SET standard_price = price_per_night 
        WHERE standard_price IS NULL;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { 
        sql_string: sql 
    });

    if (error) {
        console.log('failed:', error.message);
    } else {
        console.log('SUCCESS! Migration completed:', data);
    }
}

runMigration();
