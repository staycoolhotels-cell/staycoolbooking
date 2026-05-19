const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');


const configs = [
    {
        name: 'Direct Connection (Port 5432)',
        host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: '2bFZKr8g15GBpfng',
        ssl: { rejectUnauthorized: false }
    },
    {
        name: 'Session Pooler (Port 5432)',
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.dlislsrlwovcxsuqdlvy',
        password: '2bFZKr8g15GBpfng',
        ssl: { rejectUnauthorized: false }
    }
];

async function applyFix() {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', 'manual_fix_razorpay_id.sql'), 'utf8');

    for (const config of configs) {
        console.log(`Trying ${config.name}...`);
        const pool = new Pool(config);
        let client;
        try {
            client = await pool.connect();
            console.log(`Connected via ${config.name}!`);
            await client.query(sql);
            console.log('SUCCESS: SQL applied successfully.');
            return; // Exit if successful
        } catch (err) {
            console.error(`Failed via ${config.name}:`, err.message);
        } finally {
            if (client) client.release();
            await pool.end();
        }
    }

    console.error('CRITICAL: All connection methods failed. Please run the SQL manually in the Supabase Dashboard SQL Editor.');
}

applyFix();
