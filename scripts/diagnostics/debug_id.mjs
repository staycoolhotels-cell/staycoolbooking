import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSpecificId(guestId) {
  console.log(`[DEBUG] Testing for ID: ${guestId}`);
  
  // 1. Fetch from users table
  const { data: guest, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', guestId)
    .maybeSingle();
    
  console.log("DB Result:", guest ? "FOUND" : "NOT FOUND");
  if (userError) console.error("DB Error:", userError);
  
  if (!guest) {
    console.log("Attempting Auth fetch...");
    const { data: { user: authUser }, error: authFetchError } = await supabaseAdmin.auth.admin.getUserById(guestId);
    console.log("Auth Result:", authUser ? "FOUND" : "NOT FOUND");
    if (authFetchError) console.error("Auth Error:", authFetchError);
  } else {
    console.log("Guest details in DB:", {
        id: guest.id,
        name: guest.name,
        role: guest.role,
        email: guest.email
    });
  }
}

debugSpecificId('67e936f8-169b-45d3-b7f2-3360cf4eb46a');
