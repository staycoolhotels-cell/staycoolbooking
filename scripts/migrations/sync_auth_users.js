import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function syncUsers() {
    console.log("Syncing users from auth.users to public.users...");

    // 1. Get all public users
    const { data: publicUsers } = await supabaseAdmin.from('users').select('id');
    const publicUserIds = new Set(publicUsers?.map(u => u.id) || []);

    // 2. Get all auth users
    const { data: { users: authUsers }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) {
        console.error("Error fetching auth users:", authErr);
        return;
    }

    let synced = 0;
    for (const authUser of authUsers) {
        if (!publicUserIds.has(authUser.id)) {
            console.log("Missing user found, syncing:", authUser.email);
            const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';

            const { error: insertErr } = await supabaseAdmin.from('users').insert([{
                id: authUser.id,
                email: authUser.email,
                name: fullName,
                role: authUser.user_metadata?.role || 'guest',
                status: 'active'
            }]);

            if (insertErr) {
                console.error("Failed to sync user", authUser.email, ":", insertErr);
            } else {
                synced++;
            }
        }
    }

    console.log(`Sync complete. Synced ${synced} missing users.`);
}

syncUsers();
