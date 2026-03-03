
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env because dotenv seems flaky in this environment
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
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
        // Manually format error to ensure it's visible in truncated logs
        console.error('ERROR_QUERYING:', error.code, error.message);
        return;
    }

    console.log('SUCCESS: Table user_wallets exists.');

    if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log('COLUMNS:', keys.join(', '));
        if (keys.includes('razorpay_account_id')) {
            console.log('PASS: Column razorpay_account_id exists.');
        } else {
            console.log('FAIL: Column razorpay_account_id MISSING.');
        }
    } else {
        console.log('Table empty. Testing column existence via update...');
        const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ razorpay_account_id: 'test' })
            .eq('user_id', '00000000-0000-0000-0000-000000000000');

        if (updateError) {
            console.log('UPDATE_ERROR:', updateError.code, updateError.message);
            if (updateError.code === '42703') {
                console.error('FAIL: Column razorpay_account_id does NOT exist.');
            }
        } else {
            console.log('PASS: Column razorpay_account_id exists.');
        }
    }
}

checkSchema();
