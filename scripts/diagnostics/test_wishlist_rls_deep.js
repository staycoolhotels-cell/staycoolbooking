import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function testRLS() {
    console.log("Testing RLS...");
    const { data: users, error: userErr } = await supabaseAdmin.from('users').select('id').limit(1);
    if (userErr || !users.length) {
        console.error("Failed to get user:", userErr);
        return;
    }
    const testUserId = users[0].id;
    const { data: props } = await supabaseAdmin.from('properties').select('id').limit(1);
    const propId = props[0].id;
    const { data: existingWishlist } = await supabaseAdmin.from('wishlist')
        .select('*').eq('user_id', testUserId).eq('property_id', propId).maybeSingle();

    let wishlistItemId = existingWishlist?.id;
    if (!wishlistItemId) {
        const { data: inserted, error: insErr } = await supabaseAdmin.from('wishlist')
            .insert([{ user_id: testUserId, property_id: propId }]).select().single();
        if (insErr) {
            console.error("Admin insert failed:", insErr);
            return;
        }
        wishlistItemId = inserted.id;
    }

    const email = `test_rls_${Date.now()}@test.com`;
    const password = "StrongPassword123!@#";
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
        email, password
    });

    if (signUpErr) {
        console.error("Sign up error:", signUpErr);
        return;
    }

    const newUserId = signUpData.user.id;
    await supabaseAdmin.from('profiles').insert([{ id: newUserId, email, full_name: "Test RLS" }]);

    const { data: userInsertData, error: userInsertErr } = await supabaseClient.from('wishlist')
        .insert([{ user_id: newUserId, property_id: propId }]).select();

    const { data: userReadData, error: userReadErr } = await supabaseClient.from('wishlist')
        .select('*').eq('user_id', newUserId);

    fs.writeFileSync('rls_test_result.json', JSON.stringify({
        insert: { data: userInsertData, error: userInsertErr },
        read: { data: userReadData, error: userReadErr }
    }, null, 2));

    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    await supabaseAdmin.from('wishlist').delete().eq('user_id', newUserId);
    await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
    await supabaseAdmin.from('users').delete().eq('id', newUserId);

    console.log("Test finished, results in rls_test_result.json");
}

testRLS();
