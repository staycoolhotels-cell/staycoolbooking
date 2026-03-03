import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('messages').select('count', { count: 'exact' });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total messages:', data.length > 0 ? data[0].count : 0);
    }

    const { data: real_msgs, error: e2 } = await supabase.from('messages').select('*').limit(5);
    console.log("Found messages:", real_msgs?.length);
    if (real_msgs?.length > 0) {
        console.dir(real_msgs);
    } else {
        // try to insert
        const { data: users } = await supabase.from('users').select('id').limit(2);
        const { data: props } = await supabase.from('properties').select('id').limit(1);

        if (users && users.length >= 2) {
            console.log("Inserting dummy message...");
            const msg = {
                sender_id: users[0].id,
                receiver_id: users[1].id,
                content: "Hello this is a test message from the new UI.",
                sentiment: "Happy",
                is_read: false
            };
            if (props && props.length > 0) {
                msg.property_id = props[0].id;
            }
            const { error: iErr } = await supabase.from('messages').insert([msg]);
            console.log("Insert error?:", iErr || "Success");
        }
    }
}
check();
