const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const result = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/wishlist?limit=1`, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    const text = await result.text();
    console.log("Raw REST Response:", text);
}

checkSchema();
