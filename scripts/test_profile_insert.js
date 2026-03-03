import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function run() {
    console.log("Testing inserting into profiles...");
    const { data: users } = await supabase.from('users').select('id, name, email').limit(1);
    if (!users?.length) { console.log("No users found"); return; }

    const user = users[0];
    const { data: profileCheck, error: pCErr } = await supabase.from('profiles').select('*').eq('id', user.id);

    if (pCErr) {
        console.error("Profiles error:", pCErr);
    } else {
        console.log("Profile check:", profileCheck);
        if (profileCheck.length === 0) {
            console.log("Inserting profile...");
            const { data: insData, error: insErr } = await supabase.from('profiles').insert([{ id: user.id, full_name: user.name || "Test User", email: user.email }]);
            console.log("Insert result:", { insData, insErr });
        }

        // now retry wishlist
        const { data: props } = await supabase.from('properties').select('id').limit(1);
        const { data, error } = await supabase.from('wishlist').insert([{ user_id: user.id, property_id: props[0].id }]);
        console.log("Wishlist insert result:", { data, error });
    }
}

run();
