
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking user_wallets table schema...');

    const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying user_wallets:', JSON.stringify(error, null, 2));
        return;
    }

    console.log('Success: Table user_wallets exists.');

    // Create a dummy mismatch query to check if column exists in the error message if row is empty
    // Or if we have data, validation is easy.
    if (data && data.length > 0) {
        console.log('Row sample:', data[0]);
        if ('razorpay_account_id' in data[0]) {
            console.log('PASS: Column razorpay_account_id exists.');
        } else {
            console.log('WARNING: razorpay_account_id not found in user_wallets sample row.');
        }
    } else {
        console.log('Table user_wallets is empty. Verifying column via failure injection...');

        const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ razorpay_account_id: 'test_val' } as any)
            .eq('user_id', '00000000-0000-0000-0000-000000000000'); // mismatch

        if (updateError) {
            if (updateError.code === '42703') { // Undefined column
                console.error('FAIL: Column razorpay_account_id does not exist.');
                console.error(updateError);
            } else {
                console.log('Column check result:', updateError.message);
            }
        } else {
            // If no error, it means the column exists and the update simply affected 0 rows
            console.log('PASS: Column razorpay_account_id likely exists (update query prepared successfully).');
        }
    }
}

checkSchema();
