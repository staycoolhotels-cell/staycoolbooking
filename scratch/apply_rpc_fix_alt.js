const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

// Try port 6543 (transaction pooling) if 5432 times out
const dbUrl = `postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:6543/postgres`;
const config = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }, 
}

async function applySql() {
    console.log('Connecting to Supabase (port 6543)...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected! Applying FIX_CREATE_PROPERTY_RPC.sql...');

        const sql = fs.readFileSync('FIX_CREATE_PROPERTY_RPC.sql', 'utf8');

        await client.query(sql);
        console.log('SQL executed successfully!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
