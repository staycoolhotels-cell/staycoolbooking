const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

// Supabase Connection String format: postgresql://[user]:[password]@[host]:[port]/[database]
// We know the connection string is db.dlislsrlwovcxsuqdlvy.supabase.co based on project ref
const dbUrl = `postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres`;
const config = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }, // Supabase needs this for external connects
}

async function applySql() {
    console.log('Connecting to Supabase db.dlislsrlwovcxsuqdlvy.supabase.co...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected! Applying SUPABASE_APPLY_ME.sql...');

        const sql = fs.readFileSync('SUPABASE_APPLY_ME.sql', 'utf8');

        await client.query(sql);
        console.log('SQL executed successfully!');

        // Notify PostgREST to reload schema
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
