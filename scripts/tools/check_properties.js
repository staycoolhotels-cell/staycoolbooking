const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data: properties, error } = await supabase.from('properties').select('*');
    if (error) {
        console.error('Error fetching properties:', error);
    } else {
        console.log(`Current properties count in database: ${properties.length}`);
        properties.forEach(p => {
            console.log(`- [${p.id}] Name: ${p.name || p.title}, Status: ${p.status}`);
        });
    }
}
run();
