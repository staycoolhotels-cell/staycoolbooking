const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function checkSchema() {
    const result = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    const json = await result.json();

    if (json.definitions && json.definitions.wishlist) {
        fs.writeFileSync('schema.json', JSON.stringify(Object.keys(json.definitions.wishlist.properties), null, 2));
    }
}

checkSchema();
