const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const ADMIN_ID = '67e936f8-169b-45d3-b7f2-3360cf4eb46a';
const HOST_ID = '38ac5294-564b-45ba-ab18-035f59c30e19';

// We can't easily simulate a specific user's session with just the anon key if RLS is on auth.uid()
// But we can check what the policies are.

// Actually, I can check if the admin ID in public.users has role='admin'.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminRole() {
    const { data, error } = await supabase.from('users').select('role').eq('id', ADMIN_ID).single();
    console.log('Admin role in DB:', data?.role);
}

checkAdminRole();
