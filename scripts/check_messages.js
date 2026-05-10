const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const HOST_ID = '38ac5294-564b-45ba-ab18-035f59c30e19';
const ADMIN_ID = '67e936f8-169b-45d3-b7f2-3360cf4eb46a';

async function checkMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${HOST_ID},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${HOST_ID})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
    } else {
        console.log('Messages between host and admin:', data);
    }
}

checkMessages();
