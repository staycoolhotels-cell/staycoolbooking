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

    const configs = [
        // Configuration 1: AWS Pooler with exact DB password
        {
            name: 'AWS Pooler 6543 (Standard DB Password)',
            host: 'aws-0-ap-south-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            user: 'postgres.dlislsrlwovcxsuqdlvy',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        },
        // Configuration 2: AWS Pooler 5432 with exact DB password
        {
            name: 'AWS Pooler 5432 (Standard DB Password)',
            host: 'aws-0-ap-south-1.pooler.supabase.com',
            port: 5432,
            database: 'postgres',
            user: 'postgres.dlislsrlwovcxsuqdlvy',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        },
        // Configuration 3: DB Direct domain 6543
        {
            name: 'Direct Supabase DB Domain 6543',
            host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
            port: 6543,
            database: 'postgres',
            user: 'postgres',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        },
        // Configuration 4: AWS Pooler 6543 with Service Role Key
        ...(serviceRoleKey ? [{
            name: 'AWS Pooler 6543 (Service Role Key)',
            host: 'aws-0-ap-south-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            user: 'postgres.dlislsrlwovcxsuqdlvy',
            password: serviceRoleKey,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        }] : []),
        // Configuration 5: Direct DB Domain 5432
        {
            name: 'Direct Supabase DB Domain 5432',
            host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        }
    ];

    let success = false;

    for (const config of configs) {
        console.log(`\n--- Attempting connection: ${config.name} ---`);
        const client = new Client(config);
        try {
            await client.connect();
            console.log('Connected successfully!');

            console.log('Executing SQL statement...');
            await client.query(`
                ALTER TABLE public.properties 
                ADD COLUMN IF NOT EXISTS standard_price INTEGER;

                UPDATE public.properties 
                SET standard_price = price_per_night 
                WHERE standard_price IS NULL;

                NOTIFY pgrst, 'reload schema';
            `);
            console.log('SUCCESS: standard_price column added and schema reloaded!');
            
            await client.end();
            success = true;
            break; // Stop on first success
        } catch (err) {
            console.error(`Failed with config ${config.name}:`, err.message);
            try {
                await client.end();
            } catch (e) {}
        }
    }

    if (!success) {
        console.error('\n❌ All database connection attempts failed!');
        process.exit(1);
    }
}

run();
