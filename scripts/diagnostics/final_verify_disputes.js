import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalVerify() {
    const { error } = await supabase.from('disputes').select('*').limit(0);
    if (error) {
        console.log('Verification failed:', error.message);
    } else {
        console.log('VERIFICATION_SUCCESS: Disputes table exists.');
    }
}

finalVerify();
