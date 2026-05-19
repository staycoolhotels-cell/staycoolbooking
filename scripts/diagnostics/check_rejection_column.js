const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envPath)) throw new Error('.env file not found');

        const envContent = fs.readFileSync(envPath, 'utf8');
        const roleKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
        if (!roleKeyMatch) throw new Error('KEY not found');
        const serviceRoleKey = roleKeyMatch[1].trim();
        const host = '3.108.251.216';
        const port = 6543;
        const user = 'postgres.dlislsrlwovcxsuqdlvy';
        const db = 'postgres';

        const connectionString = `postgres://${user}:${serviceRoleKey}@${host}:${port}/${db}`;

        console.log(`Connecting to ${host}...`);

        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        });

        await client.connect();
        console.log('Connected!');

        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'rejection_reason';
    `);

        if (res.rows.length > 0) {
            console.log('Column rejection_reason EXISTS.');
        } else {
            console.log('Column rejection_reason DOES NOT EXIST.');
        }

        await client.end();

    } catch (err) {
        console.error('Check Failed:', err.message);
        process.exit(1);
    }
}

run();
