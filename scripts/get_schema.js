const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSchema() {
    const result = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    const json = await result.json();

    if (json.definitions && json.definitions.wishlist) {
        console.log("Wishlist Schema Properties:", Object.keys(json.definitions.wishlist.properties));
    } else {
        console.log("No wishlist definition found");
    }
}

checkSchema();
