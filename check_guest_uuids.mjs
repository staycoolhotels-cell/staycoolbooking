import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMessagesSchema() {
  const { data: columns, error } = await supabaseAdmin.rpc('get_table_columns', { table_name: 'messages' });
  // If rpc doesn't exist, try plain query
  if (error) {
     const { data: cols, error: err2 } = await supabaseAdmin.from('messages').select().limit(1);
     console.log("Sample message row:", cols?.[0]);
     process.exit(0);
  }
}

async function checkAllPossibleIds() {
  // Check if there are any sender_ids that aren't UUIDs
  const { data: messages } = await supabaseAdmin.from('messages').select('sender_id, receiver_id');
  const problematicIds = [];
  messages?.forEach(m => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (m.sender_id && !uuidRegex.test(m.sender_id)) problematicIds.push({id: m.sender_id, field: 'sender_id'});
    if (m.receiver_id && !uuidRegex.test(m.receiver_id)) problematicIds.push({id: m.receiver_id, field: 'receiver_id'});
  });

  console.log("Non-UUID IDs in messages:", problematicIds);
}

checkAllPossibleIds();
