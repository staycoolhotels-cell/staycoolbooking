const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

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
        console.error('Error querying user_wallets:', error);
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

            console.log('WARNING: razorpay_account_id not found in user_wallets sample row. (It might be null, but key should exist)');
        }
    } else {
        console.log('Table user_wallets is empty. Cannot verify columns from data.');


        const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ razorpay_account_id: 'test' })
            .eq('user_id', '00000000-0000-0000-0000-000000000000');

        if (updateError) {
            if (updateError.code === '42703') {
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
