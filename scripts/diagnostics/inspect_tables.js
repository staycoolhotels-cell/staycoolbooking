import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error(`Error querying ${tableName}:`, error);
    } else {
        console.log(`Columns for ${tableName}:`, data.length > 0 ? Object.keys(data[0]) : "Empty table, cannot infer columns from data.");
    }
}

async function main() {
    await inspectTable('users');
    await inspectTable('properties');
    await inspectTable('messages');
}

main();
