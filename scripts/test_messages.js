import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need greater perms maybe? Let's use service key if anon fails

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing messages fetch...');
    const { data: { users }, error: authError } = await createClient(supabaseUrl, supabaseServiceRoleKey).auth.admin.listUsers();

    if (authError || !users || users.length === 0) {
        console.log('Could not get test user:', authError);
        return;
    }

    const testUserId = users[0].id;
    console.log('Using test user ID:', testUserId);

    const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:users!messages_sender_id_fkey(name),
      property:properties!messages_property_id_fkey(name)
    `)
        .eq('receiver_id', testUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching messages:', error);
    } else {
        console.log('Fetched messages:', messagesData.length);
        console.log(messagesData);
    }
}

testFetch();
