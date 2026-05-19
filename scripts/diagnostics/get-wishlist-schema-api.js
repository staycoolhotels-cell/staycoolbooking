import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function checkSchema() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const profilesDef = data.definitions.profiles;
    console.log("Profiles columns:", Object.keys(profilesDef.properties || {}));

    if (!profilesDef.properties.reward_points) {
        console.log("❌ profiles.reward_points column MISSING - this will also need to be added!");
    } else {
        console.log("✅ profiles.reward_points exists:", profilesDef.properties.reward_points);
    }
}
checkSchema();
