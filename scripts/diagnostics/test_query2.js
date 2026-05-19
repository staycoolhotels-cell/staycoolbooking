import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:users!messages_sender_id_fkey(name),
      property:properties!messages_property_id_fkey(name)
    `);
    fs.writeFileSync('out2.json', JSON.stringify({ error }, null, 2));
}
check();
