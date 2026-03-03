import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:users!messages_sender_id_fkey(name),
      property:properties!messages_property_id_fkey(title)
    `)
        .limit(5);

    if (error) {
        console.error('Error fetching messages:', error);
    } else {
        console.log('Fetched messages:', messagesData.length);
        console.dir(messagesData, { depth: null });
    }
}

testFetch();
