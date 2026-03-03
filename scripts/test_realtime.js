import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env' });
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRealtime() {
    console.log("Setting up realtime subscription on messages table...");
    let received = false;

    const channel = supabase
        .channel('messages-realtime-test')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                console.log("RECEIVED REALTIME EVENT!");
                console.log(payload);
                received = true;
            }
        )
        .subscribe(async (status) => {
            console.log("Subscription status:", status);
            if (status === 'SUBSCRIBED') {
                console.log("Waiting 2 seconds then inserting a test message...");
                setTimeout(async () => {
                    const { data: users } = await supabase.from('users').select('id').limit(2);
                    if (users && users.length >= 2) {
                        await supabase.from('messages').insert({
                            sender_id: users[0].id,
                            receiver_id: users[1].id,
                            content: "Realtime test ping!",
                            sentiment: "Neutral",
                            is_read: false
                        });
                        console.log("Successfully inserted test message.");
                    } else {
                        console.log("Not enough users to create a message.");
                    }
                }, 2000);
            }
        });

    setTimeout(() => {
        console.log("Finished waiting for events.");
        if (!received) {
            console.log("DID NOT RECEIVE ANY REALTIME EVENT. Realtime is likely disabled for the 'messages' table.");
        }
        supabase.removeChannel(channel).then(() => process.exit(0));
    }, 10000);
}

testRealtime();
