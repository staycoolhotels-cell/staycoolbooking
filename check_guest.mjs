import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllPossibleIds() {
  const ids = new Set();
  
  // Messages
  const { data: messages } = await supabaseAdmin.from('messages').select('sender_id, receiver_id');
  messages?.forEach(m => { ids.add(m.sender_id); ids.add(m.receiver_id); });
  
  // Bookings
  const { data: bookings } = await supabaseAdmin.from('bookings').select('guest_id, host_id');
  bookings?.forEach(b => { ids.add(b.guest_id); ids.add(b.host_id); });
  
  const results = [];
  for (const id of ids) {
    if (!id) continue;
    const { data: userTable } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
      
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (!userTable || !authData?.user?.id) {
      results.push({
        id,
        in_users_table: !!userTable,
        in_auth: !!authData?.user?.id,
        auth_error: authError?.message || null
      });
    }
  }
  
  fs.writeFileSync('guest_check_results.json', JSON.stringify({
    total_unique_ids: ids.size,
    problematic_ids: results
  }, null, 2));
}

checkAllPossibleIds();
