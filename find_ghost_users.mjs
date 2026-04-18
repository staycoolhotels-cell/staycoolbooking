import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findGhostUsers() {
  console.log("Fetching all messages...");
  const { data: messages } = await supabaseAdmin.from('messages').select('sender_id, receiver_id');
  
  const threadIds = new Set();
  messages?.forEach(m => {
    threadIds.add(m.sender_id);
    threadIds.add(m.receiver_id);
  });
  
  console.log(`Found ${threadIds.size} unique IDs in messages.`);
  
  console.log("Fetching all auth users...");
  const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing auth users:", listError);
    return;
  }
  
  const authIdSet = new Set(authUsers.map(u => u.id));
  
  const ghosts = [];
  for (const tid of threadIds) {
    if (!authIdSet.has(tid)) {
      ghosts.push(tid);
    }
  }
  
  if (ghosts.length > 0) {
    console.log("The following IDs are in messages but NOT in auth.users:");
    ghosts.forEach(g => console.log(` - ${g}`));
  } else {
    console.log("All IDs in messages are present in auth.users.");
  }
}

findGhostUsers();
