const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    let serviceRoleKey = '';
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const roleKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
            if (roleKeyMatch) {
                serviceRoleKey = roleKeyMatch[1].trim();
            }
        }
    } catch (e) {
        console.log('Could not read .env file');
    }

    if (!serviceRoleKey) {
        console.error('Service Role Key not found in .env');
        process.exit(1);
    }

    const config = {
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.dlislsrlwovcxsuqdlvy',
        password: serviceRoleKey,
        ssl: { rejectUnauthorized: false }
    };

    console.log('Connecting to database via aws-0 pooler on port 6543 with Service Role Key...');
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connected!');

        console.log('Adding standard_price column...');
        await client.query(`
            ALTER TABLE public.properties 
            ADD COLUMN IF NOT EXISTS standard_price INTEGER;

            UPDATE public.properties 
            SET standard_price = price_per_night 
            WHERE standard_price IS NULL;
        `);
        console.log('Successfully added standard_price column!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('PostgREST schema reload notified.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
}

run();
