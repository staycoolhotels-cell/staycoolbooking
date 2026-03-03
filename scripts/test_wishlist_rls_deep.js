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

    // 1. Get a test user
    const { data: users, error: userErr } = await supabaseAdmin.from('users').select('id').limit(1);
    if (userErr || !users.length) {
        console.error("Failed to get user:", userErr);
        return;
    }
    const testUserId = users[0].id;

    // 2. Insert a dummy property and wishlist item using admin
    const { data: props } = await supabaseAdmin.from('properties').select('id').limit(1);
    const propId = props[0].id;

    // Check if it's already there
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

    // 3. Create a JWT for this user to test RLS
    // we can use the admin api to sign the user in, or simply use supabase js to generate a token?
    // Let's use custom access token if we can, or just admin generate link.
    // Instead, let's just make a very simple API request with anon key and a fake JWT. 
    // Wait, let's create a real test user and sign in with password!

    const email = `test_rls_${Date.now()}@test.com`;
    const password = "StrongPassword123!@#";

    // Sign up
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
        email, password
    });

    if (signUpErr) {
        console.error("Sign up error:", signUpErr);
        return;
    }

    const newUserId = signUpData.user.id;

    // create profile
    await supabaseAdmin.from('profiles').insert([{ id: newUserId, email, full_name: "Test RLS" }]);

    // Insert as the user!
    const { data: userInsertData, error: userInsertErr } = await supabaseClient.from('wishlist')
        .insert([{ user_id: newUserId, property_id: propId }]).select();

    // Read back as the user!
    const { data: userReadData, error: userReadErr } = await supabaseClient.from('wishlist')
        .select('*').eq('user_id', newUserId);

    fs.writeFileSync('rls_test_result.json', JSON.stringify({
        insert: { data: userInsertData, error: userInsertErr },
        read: { data: userReadData, error: userReadErr }
    }, null, 2));

    // cleanup
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    await supabaseAdmin.from('wishlist').delete().eq('user_id', newUserId);
    await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
    await supabaseAdmin.from('users').delete().eq('id', newUserId);

    console.log("Test finished, results in rls_test_result.json");
}

testRLS();
