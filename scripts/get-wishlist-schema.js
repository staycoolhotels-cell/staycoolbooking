import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function checkSchema() {
    const { data: cols } = await supabase.rpc('execute_sql', {
        sql_string: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wishlist';`
    });

    fs.writeFileSync('wishlist-schema.json', JSON.stringify(cols, null, 2));
    console.log("Schema written to wishlist-schema.json");

    // Also get foreign keys
    const { data: fks } = await supabase.rpc('execute_sql', {
        sql_string: `
        SELECT
            tc.table_schema, 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='wishlist';
        `
    });
    fs.writeFileSync('wishlist-fks.json', JSON.stringify(fks, null, 2));
    console.log("FKs written to wishlist-fks.json");
}
checkSchema();
