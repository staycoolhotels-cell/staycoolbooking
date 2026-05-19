import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActivities() {
    const { data, error } = await supabase.from('activities').select('count', { count: 'exact', head: true });
    console.log('Activities table test:', { exists: !error, error: error?.message });
}

checkActivities();
