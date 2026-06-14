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

    const hosts = [
        'aws-1-ap-south-1.pooler.supabase.com',
        'aws-0-ap-south-1.pooler.supabase.com'
    ];

    const configs = [];
    for (const host of hosts) {
        // Option A: 6543 (transaction pooling) with DB Password
        configs.push({
            name: `${host} : 6543 with DB Password`,
            host,
            port: 6543,
            database: 'postgres',
            user: 'postgres.dlislsrlwovcxsuqdlvy',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false }
        });

        // Option B: 5432 (session pooling) with DB Password
        configs.push({
            name: `${host} : 5432 with DB Password`,
            host,
            port: 5432,
            database: 'dlislsrlwovcxsuqdlvy',
            user: 'postgres.dlislsrlwovcxsuqdlvy',
            password: '2bFZKr8g15GBpfng',
            ssl: { rejectUnauthorized: false }
        });

        if (serviceRoleKey) {
            // Option C: 6543 (transaction pooling) with Service Role Key
            configs.push({
                name: `${host} : 6543 with Service Role Key`,
                host,
                port: 6543,
                database: 'postgres',
                user: 'postgres.dlislsrlwovcxsuqdlvy',
                password: serviceRoleKey,
                ssl: { rejectUnauthorized: false }
            });

            // Option D: 5432 (session pooling) with Service Role Key
            configs.push({
                name: `${host} : 5432 with Service Role Key`,
                host,
                port: 5432,
                database: 'dlislsrlwovcxsuqdlvy',
                user: 'postgres.dlislsrlwovcxsuqdlvy',
                password: serviceRoleKey,
                ssl: { rejectUnauthorized: false }
            });
        }
    }

    let success = false;
    for (const config of configs) {
        console.log(`\nTrying config: ${config.name}...`);
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
            console.log('SUCCESS: standard_price column added!');

            await client.query("NOTIFY pgrst, 'reload schema'");
            console.log('PostgREST schema reload notified.');

            await client.end();
            success = true;
            break;
        } catch (err) {
            console.error('Failed:', err.message);
            try {
                await client.end();
            } catch (e) {}
        }
    }

    if (!success) {
        console.error('\n❌ All migration attempts failed!');
        process.exit(1);
    }
}

run();
