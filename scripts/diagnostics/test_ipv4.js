const { Client } = require('pg');

async function test() {
    const config = {
        host: '3.108.251.216', // IPv4 address of aws-0-ap-south-1.pooler.supabase.com
        port: 6543,
        database: 'postgres',
        user: 'postgres.dlislsrlwovcxsuqdlvy',
        password: '2bFZKr8g15GBpfng',
        ssl: { rejectUnauthorized: false }
    };
    const client = new Client(config);
    try {
        console.log('Connecting with IPv4...');
        await client.connect();
        console.log('SUCCESS: Connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
test();
