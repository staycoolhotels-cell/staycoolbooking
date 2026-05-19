import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const { data: cols, error: colError } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

    if (colError) {
        fs.writeFileSync('out.json', JSON.stringify(colError));
    } else {
        if (cols.length > 0) {
            fs.writeFileSync('out.json', JSON.stringify(Object.keys(cols[0])));
        } else {
            const { data, error } = await supabase.rpc('inspect_table', { table_name: 'properties' });
            fs.writeFileSync('out.json', JSON.stringify(data || error));
        }
    }
}

checkSchema();
