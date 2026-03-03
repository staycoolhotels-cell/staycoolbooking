const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS for schema inspection
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking user_wallets table schema...');

    // 1. Check if table exists and get columns by inserting a dummy row (transaction will be rolled back or failed)
    // Actually, a better way is to just query the table structure if possible, or try to select from it
    // We can use the rpc call if available, or just try to select * limit 1 and see the error or data

    const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying user_wallets:', error);
        // error 42P01 means table does not exist
        if (error.code === '42P01') {
            console.error('FAIL: Table user_wallets does not exist.');
        }
        return;
    }

    console.log('Success: Table user_wallets exists.');

    if (data && data.length > 0) {
        console.log('Row sample:', data[0]);
        if ('razorpay_account_id' in data[0]) {
            console.log('PASS: Column razorpay_account_id exists.');
        } else {
            // If row exists but column doesn't, it might be null and not showing up? 
            // No, supbase select * should show nulls too usually, but let's see.
            // Actually, if the column exists it should be returned in the object even if null (as null)
            // unless user has defined a specific select list. We used select('*').
            console.log('WARNING: razorpay_account_id not found in user_wallets sample row. (It might be null, but key should exist)');
        }
    } else {
        console.log('Table user_wallets is empty. Cannot verify columns from data.');

        // Try resolving by checking if we can update a non-existent row with that column
        // This is a hacky way to check if column exists without admin API
        const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ razorpay_account_id: 'test' })
            .eq('user_id', '00000000-0000-0000-0000-000000000000'); // mismatch

        if (updateError) {
            if (updateError.code === '42703') { // Undefined column
                console.error('FAIL: Column razorpay_account_id does not exist.');
            } else {
                console.log('Column check result:', updateError.message);
            }
        } else {
            console.log('PASS: Column razorpay_account_id likely exists (update query prepared successfully).');
        }
    }
}

checkSchema();
