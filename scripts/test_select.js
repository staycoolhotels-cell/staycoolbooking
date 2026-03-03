import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const testUserId = 'f6f311d9-8c0'
    const out = {};

    const r1 = await supabase.from('messages').select(`*, sender:users(name)`).limit(1);
    out.r1 = r1;

    const r2 = await supabase.from('messages').select(`*, sender:users!messages_sender_id_fkey(name)`).limit(1);
    out.r2 = r2;

    const r4 = await supabase.from('messages').select(`*`).limit(1);
    out.r4 = r4;

    fs.writeFileSync('out.json', JSON.stringify(out, null, 2));
}
check();
