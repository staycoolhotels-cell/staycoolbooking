import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkPolicies() {
    let data, error;
    try {
        const res = await supabase.rpc('get_policies_for_table', { table_name: 'wishlist' });
        data = res.data;
        error = res.error;
    } catch (e: any) {
        data = null;
        error = 'No RPC found';
    }

    if (error) {

        const { data: qData, error: qError } = await supabase.from('wishlist').select('*').limit(1);
        console.log("Wishlist direct query works:", !qError);
        if (qError) console.error(qError);
        return;
    }

    console.log('Policies:', data);
}

checkPolicies();
