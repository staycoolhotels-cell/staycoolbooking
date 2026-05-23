const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (!fs.existsSync(envPath)) throw new Error('.env file not found');

        const envContent = fs.readFileSync(envPath, 'utf8');
        const roleKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
        if (!roleKeyMatch) throw new Error('KEY not found');
        const serviceRoleKey = roleKeyMatch[1].trim();

        // Validated AWS Pooler IP
        const host = '3.108.251.216';
        const port = 6543;
        const user = 'postgres.dlislsrlwovcxsuqdlvy';
        const db = 'postgres';

        console.log(`Connecting directly to database pooler at ${host}:${port} as ${user}...`);

        const client = new Client({
            host,
            port,
            user,
            password: serviceRoleKey,
            database: db,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 20000
        });

        await client.connect();
        console.log('Connected successfully!');

        console.log('Adding amenities column to public.bookings table...');
        await client.query(`
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb;
            NOTIFY pgrst, 'reload schema';
        `);

        console.log('SUCCESS: Column amenities added to public.bookings!');
        await client.end();

    } catch (err) {
        console.error('Migration Failed:', err.message);
        process.exit(1);
    }
}

run();
