const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is required for this check.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPropertiesSchema() {
    console.log("Fetching columns for 'properties' table...");
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'properties' });
    
    if (error) {
        // If RPC doesn't exist, try a direct query to information_schema if possible, 
        // but Supabase usually restricts this. Let's try to just select all columns and see what we get.
        console.log("RPC get_table_columns failed, trying select * limit 0...");
        const { data: selectData, error: selectError } = await supabase.from('properties').select('*').limit(1);
        if (selectError) {
            console.error("Error selecting from properties:", selectError.message);
        } else {
            console.log("Columns in properties:", Object.keys(selectData[0] || {}));
        }
    } else {
        console.log("Columns in properties (via RPC):", data);
    }

    console.log("\nFetching columns for 'rooms' table...");
    const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('*').limit(1);
    if (roomsError) {
        console.error("Error selecting from rooms:", roomsError.message);
    } else {
        console.log("Columns in rooms:", Object.keys(roomsData[0] || {}));
    }
}

checkPropertiesSchema();
