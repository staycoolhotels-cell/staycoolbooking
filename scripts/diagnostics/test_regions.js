const { Client } = require('pg');

const regions = [
    'ap-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-central-1',
    'sa-east-1',
    'ca-central-1'
];

async function test() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const config = {
            host,
            port: 6543,
            database: 'postgres',
            user: 'postgres.dlislsrlwovcxsuqdlvy',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
        };
        const client = new Client(config);
        try {
            console.log(`Testing region ${region} (${host})...`);
            await client.connect();
            console.log(`✅ SUCCESS: Connected to region ${region}!`);
            const res = await client.query('SELECT NOW()');
            console.log('Time:', res.rows[0]);
            await client.end();
            break; // found it!
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
            try {
                await client.end();
            } catch (e) {}
        }
    }
}
test();
